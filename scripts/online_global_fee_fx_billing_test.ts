import { supabase } from '../src/integrations/supabase/client'
import { getCurrentExchangeRate } from '../src/lib/invoiceUtils'

async function run() {
  console.log('=== Online Global ($) -> KSh billing test ===')

  // 1) Read admin FX override
  const { data: fxRow, error: fxErr } = await supabase
    .from('exchange_rate_settings')
    .select('from_currency,to_currency,rate,updated_at')
    .eq('from_currency', 'USD')
    .eq('to_currency', 'KES')
    .maybeSingle()

  if (fxErr) {
    console.error('Failed to read exchange_rate_settings:', fxErr)
    process.exit(1)
  }

  console.log('Admin FX row:', fxRow)

  // 2) Verify the rate override is actually being used by invoiceUtils
  const rate = await getCurrentExchangeRate('USD', 'KES')
  console.log(`invoiceUtils getCurrentExchangeRate('USD','KES') => ${rate}`)

  // 3) Pull the online/global (music) piano monthly fee
  // Note: invoiceUtils normalizes learning_mode 'online' => 'Online (Global)'
  const learningMode = 'Online (Global)'
  const courseType = 'music' // invoiceUtils lowercases course_category
  const courseName = 'Piano'
  const paymentType = 'monthly'

  const { data: feeRows, error: feeErr } = await supabase
    .from('fees')
    .select('id,course_type,course_name,mode,payment_type,price,currency,sessions_per_week,is_active')
    .eq('course_type', courseType)
    .eq('course_name', courseName)
    .eq('mode', learningMode)
    .eq('payment_type', paymentType)
    .eq('is_active', true)

  if (feeErr) {
    console.error('Failed to read fees:', feeErr)
    process.exit(1)
  }

  if (!feeRows || feeRows.length === 0) {
    console.error('No active fee row found for Music / Piano / Online (Global) / monthly.')
    console.log('Tip: check fees.course_type / fees.mode / fees.course_name naming conventions.')
    process.exit(1)
  }

  // If multiple rows match, pick the cheapest as a safe default (but we log all)
  console.log(`Found ${feeRows.length} matching fee row(s):`)
  console.log(feeRows)

  const chosenFee = [...feeRows].sort((a: any, b: any) => Number(a.price) - Number(b.price))[0]
  console.log('Chosen fee:', chosenFee)

  const feePrice = Number(chosenFee.price)
  const feeCurrency = chosenFee.currency

  // 4) Compute expected amount if student has 1 session/week (default)
  // invoiceUtils typically converts fee.price directly for monthly plans when sessions_per_week=1.
  const expectedKES = feeCurrency === 'KSh' ? feePrice : Math.round(feePrice * rate * 100) / 100
  console.log(`Expected KSh amount for 1 session/week: ${expectedKES}`)

  console.log('=== End test ===')
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Test failed:', e)
    process.exit(1)
  })

