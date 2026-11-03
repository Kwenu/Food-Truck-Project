import type { Promotion } from '../types/menu';

export const promotions: Promotion[] = [
{
  id: 'promo-welcome',
  code: 'WELCOME10',
  title: '10% off your order',
  description: 'First time at the truck? Take 10% off everything.',
  type: 'percent',
  value: 10,
  minSubtotal: 0,
  active: true
},
{
  id: 'promo-street5',
  code: 'STREET5',
  title: '$5 off orders over $30',
  description: 'Feeding the crew? Save $5 when you spend $30 or more.',
  type: 'flat',
  value: 5,
  minSubtotal: 30,
  active: true
},
{
  id: 'promo-happyhour',
  code: 'HAPPYHOUR',
  title: '15% off, 3–5pm',
  description: 'Afternoon happy hour discount on all items.',
  type: 'percent',
  value: 15,
  minSubtotal: 0,
  active: true
}];