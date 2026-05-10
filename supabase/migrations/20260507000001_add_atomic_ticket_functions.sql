-- ============================================================
-- 整理券のアトミック発券処理
-- SELECT ... FOR UPDATE SKIP LOCKED により TOCTOU 競合を防ぐ
-- ============================================================

-- ① 受付端末用（匿名ユーザーから呼び出し）
-- unissued チケットのみを対象とし、waiting に更新して番号を返す
CREATE OR REPLACE FUNCTION issue_next_ticket(
  p_booth_id  UUID,
  p_party_size INTEGER
)
RETURNS TABLE(ticket_number INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_id     UUID;
  v_ticket_number INTEGER;
BEGIN
  -- 最小番号の unissued チケットをロック（他の同時リクエストは SKIP）
  SELECT t.id, t.ticket_number
  INTO   v_ticket_id, v_ticket_number
  FROM   tickets t
  WHERE  t.booth_id = p_booth_id
    AND  t.status   = 'unissued'
  ORDER BY t.ticket_number ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- unissued チケットなし → 空結果を返す（呼び出し側でエラー判定）
  IF v_ticket_id IS NULL THEN
    RETURN;
  END IF;

  -- アトミックに waiting へ更新
  UPDATE tickets
  SET
    status     = 'waiting',
    party_size = p_party_size,
    updated_at = NOW()
  WHERE id = v_ticket_id;

  RETURN QUERY SELECT v_ticket_number;
END;
$$;

-- 匿名ユーザーに実行権限を付与
GRANT EXECUTE ON FUNCTION issue_next_ticket(UUID, INTEGER) TO anon;


-- ② 管理者発券用（認証済みユーザーから呼び出し）
-- unissued があればそれを使い、なければ連番で新規 waiting を作成する
CREATE OR REPLACE FUNCTION issue_ticket_admin(
  p_booth_id  UUID,
  p_party_size INTEGER
)
RETURNS TABLE(ticket_id UUID, ticket_number INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_id     UUID;
  v_ticket_number INTEGER;
  v_next_number   INTEGER;
BEGIN
  -- まず unissued チケットを優先して取得・ロック
  SELECT t.id, t.ticket_number
  INTO   v_ticket_id, v_ticket_number
  FROM   tickets t
  WHERE  t.booth_id = p_booth_id
    AND  t.status   = 'unissued'
  ORDER BY t.ticket_number ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_ticket_id IS NOT NULL THEN
    UPDATE tickets
    SET
      status     = 'waiting',
      party_size = p_party_size,
      updated_at = NOW()
    WHERE id = v_ticket_id;

    RETURN QUERY SELECT v_ticket_id, v_ticket_number;
    RETURN;
  END IF;

  -- unissued がない場合：同一ブースへの同時 INSERT による番号重複を防ぐ
  -- booth_id のハッシュをキーにしたアドバイザリーロックで直列化
  PERFORM pg_advisory_xact_lock(hashtext(p_booth_id::text));

  SELECT COALESCE(MAX(t.ticket_number), 0) + 1
  INTO   v_next_number
  FROM   tickets t
  WHERE  t.booth_id = p_booth_id;

  INSERT INTO tickets (booth_id, ticket_number, party_size, status)
  VALUES (p_booth_id, v_next_number, p_party_size, 'waiting')
  RETURNING id INTO v_ticket_id;

  RETURN QUERY SELECT v_ticket_id, v_next_number;
END;
$$;

-- 認証済みユーザーのみ実行可能
GRANT EXECUTE ON FUNCTION issue_ticket_admin(UUID, INTEGER) TO authenticated;
