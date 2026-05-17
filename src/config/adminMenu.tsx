// src/config/adminMenu.tsx

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import TvOutlinedIcon           from '@mui/icons-material/TvOutlined'
import BarChartOutlinedIcon    from '@mui/icons-material/BarChartOutlined'
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import SettingsOutlinedIcon     from '@mui/icons-material/SettingsOutlined'
import type { SvgIconComponent } from '@mui/icons-material'

export interface MenuItemConfig {
  key: string
  text: string
  pathSegment: string | null
  Icon: SvgIconComponent
}

export interface MenuGroupConfig {
  label: string
  items: MenuItemConfig[]
}

export const menuGroups: MenuGroupConfig[] = [
  {
    label: '運営当日',
    items: [
      { key: 'dashboard', text: '管理画面TOP', pathSegment: 'dashboard', Icon: DashboardOutlinedIcon },
      { key: 'monitor', text: '呼び出し画面', pathSegment: 'monitor', Icon: TvOutlinedIcon },
    ],
  },
  {
    label: '',
    items: [
      { key: 'tickets', text: '整理券PDF生成', pathSegment: 'tickets', Icon: ConfirmationNumberOutlinedIcon },
      { key: 'stats', text: '来客統計', pathSegment: 'stats', Icon: BarChartOutlinedIcon },
      { key: 'settings', text: '設定', pathSegment: 'settings', Icon: SettingsOutlinedIcon },
    ],
  },
]

export const allMenuItems = menuGroups.flatMap((g) => g.items)

export function getMenuItemByKey(key: string): MenuItemConfig | undefined {
  return allMenuItems.find((item) => item.key === key)
}

export function getBoothPath(boothId: string, pathSegment: string | null): string {
  return pathSegment ? `/admin/${boothId}/${pathSegment}` : `/admin/${boothId}`
}