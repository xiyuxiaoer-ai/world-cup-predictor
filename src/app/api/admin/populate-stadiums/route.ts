import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// All 16 World Cup 2026 stadiums with data from football2026tips.com
const STADIUMS = [
  { name_zh: 'AT&T体育场',       name_en: 'AT&T Stadium',            capacity: 80000, opened: 2009, slug: 'dallas',        lat: 32.7473,  lon: -97.0945,  photo_url: 'https://images.unsplash.com/photo-1628630470727-b726b8a15a9d?w=1200&auto=format&fit=crop&q=80' },
  { name_zh: '大都会人寿体育场',  name_en: 'MetLife Stadium',         capacity: 82500, opened: 2010, slug: 'new-york',      lat: 40.8128,  lon: -74.0742,  photo_url: 'https://images.unsplash.com/photo-1717352291614-870b74378f1d?w=1200&auto=format&fit=crop&q=80' },
  { name_zh: 'SoFi体育场',        name_en: 'SoFi Stadium',            capacity: 70000, opened: 2020, slug: 'los-angeles',  lat: 33.9535,  lon: -118.339,  photo_url: 'https://images.unsplash.com/photo-1729008014101-d1df17135730?w=1200&auto=format&fit=crop&q=80' },
  { name_zh: 'NRG体育场',         name_en: 'NRG Stadium',             capacity: 72000, opened: 2002, slug: 'houston',      lat: 29.6847,  lon: -95.4107,  photo_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/NRG%20Stadium%20SBLI%20Outside.jpg?width=1200' },
  { name_zh: '梅赛德斯-奔驰体育场', name_en: 'Mercedes-Benz Stadium',  capacity: 71000, opened: 2017, slug: 'atlanta',      lat: 33.7554,  lon: -84.401,   photo_url: 'https://images.unsplash.com/photo-1549333580-4cb2c5c8e421?w=1200&auto=format&fit=crop&q=80' },
  { name_zh: '林肯金融球场',      name_en: 'Lincoln Financial Field', capacity: 69000, opened: 2003, slug: 'philadelphia', lat: 39.9008,  lon: -75.1675,  photo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Lincoln_Financial_Field_%28Aerial_view%29.jpg/330px-Lincoln_Financial_Field_%28Aerial_view%29.jpg' },
  { name_zh: '硬石体育场',        name_en: 'Hard Rock Stadium',       capacity: 65000, opened: 1987, slug: 'miami',        lat: 25.958,   lon: -80.2389,  photo_url: 'https://images.unsplash.com/photo-1751232576220-1325999d6e7f?w=1200&auto=format&fit=crop&q=80' },
  { name_zh: 'Lumen球场',         name_en: 'Lumen Field',             capacity: 69000, opened: 2002, slug: 'seattle',      lat: 47.5952,  lon: -122.3316, photo_url: 'https://images.unsplash.com/photo-1741801515036-083f0108539a?w=1200&auto=format&fit=crop&q=80' },
  { name_zh: '李维斯球场',        name_en: "Levi's Stadium",          capacity: 68500, opened: 2014, slug: 'san-francisco',lat: 37.4033,  lon: -121.9694, photo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Levi%27s_Stadium_in_February_2016_prior_to_Super_Bowl_50_%2824398261729%29.jpg/330px-Levi%27s_Stadium_in_February_2016_prior_to_Super_Bowl_50_%2824398261729%29.jpg" },
  { name_zh: '箭头体育场',        name_en: 'Arrowhead Stadium',       capacity: 76000, opened: 1972, slug: 'kansas-city',  lat: 39.0489,  lon: -94.4839,  photo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Aerial_view_of_Arrowhead_Stadium_08-31-2013.jpg/330px-Aerial_view_of_Arrowhead_Stadium_08-31-2013.jpg' },
  { name_zh: '吉列体育场',        name_en: 'Gillette Stadium',        capacity: 65000, opened: 2002, slug: 'boston',       lat: 42.0909,  lon: -71.2643,  photo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Gillette_Stadium_%28Top_View%29.jpg/330px-Gillette_Stadium_%28Top_View%29.jpg' },
  { name_zh: '阿兹特克球场',      name_en: 'Estadio Azteca',          capacity: 83000, opened: 1966, slug: 'mexico-city',  lat: 19.3029,  lon: -99.1505,  photo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Vista_a%C3%A9rea_del_Estadio_Azteca_-_2026_-_02.jpg/330px-Vista_a%C3%A9rea_del_Estadio_Azteca_-_2026_-_02.jpg' },
  { name_zh: 'BBVA球场',          name_en: 'Estadio BBVA',            capacity: 53500, opened: 2015, slug: 'monterrey',    lat: 25.6697,  lon: -100.2446, photo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Mexico_Guadalupe_Monterrey_Estadio_BBVA_Bancomer_fifa_world_cup_2026_6.JPG/330px-Mexico_Guadalupe_Monterrey_Estadio_BBVA_Bancomer_fifa_world_cup_2026_6.JPG' },
  { name_zh: '阿克隆球场',        name_en: 'Estadio Akron',           capacity: 48000, opened: 2010, slug: 'guadalajara',  lat: 20.681,   lon: -103.4626, photo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho_%283%29.jpg/330px-Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho_%283%29.jpg' },
  { name_zh: 'BMO球场',           name_en: 'BMO Field',               capacity: 45000, opened: 2007, slug: 'toronto',      lat: 43.6332,  lon: -79.4186,  photo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Toronto_BMO_Field_in_2024.jpg/330px-Toronto_BMO_Field_in_2024.jpg' },
  { name_zh: 'BC体育馆',          name_en: 'BC Place',                capacity: 54000, opened: 1983, slug: 'vancouver',    lat: 49.2768,  lon: -123.1118, photo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/BC_Place_2015_Women%27s_FIFA_World_Cup.jpg/330px-BC_Place_2015_Women%27s_FIFA_World_Cup.jpg' },
]

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.from('stadiums').upsert(STADIUMS, { onConflict: 'name_zh' })
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(JSON.stringify({ ok: true, upserted: STADIUMS.length }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
