// src/types/database.ts

export type BoothStatus = 'empty' | 'crowded'

export type TicketStatus = 'unissued' | 'waiting' | 'called' | 'done' | 'direct' | 'on_hold'

export interface Booth {
  id: string
  name: string
  status: BoothStatus
  capacity: number
  created_at: string
}

export interface Ticket {
  id: string
  booth_id: string
  ticket_number: number
  party_size: number
  status: TicketStatus
  registered_at: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      booths: {
        Row: Booth
        Insert: Omit<Booth, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Booth, 'id' | 'created_at'>>
        Relationships: []
      }
      tickets: {
        Row: Ticket
        Insert: Omit<Ticket, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Ticket, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
