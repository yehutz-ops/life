// ⚠️ נתונים פיקטיביים זמניים — לצורך עיצוב בלבד. לא נכתבים ל-IndexedDB, לא קשורים ל-Items האמיתיים.
// כשתתווסף אינטגרציה אמיתית (בנק / אשראי / השקעות / פנסיה / הלוואות / מייל חשבוניות),
// יש להחליף רק את הקובץ הזה — שאר עמוד הכספים ורכיבי הגרפים לא אמורים להשתנות.

export const mockMonthSummary = {
  availableThisMonth: 5700,
  liquidNow: 8200,
  incomeThisMonth: 14200,
  expensesThisMonth: 8500,
  fixedExpenses: 4300,
  upcomingCommitments: 1399, // סכום ההוצאות הקרובות (mockUpcomingBills) — לשימוש בחישוב "החודש שלי"
  projectedDrop: 2100, // צפוי לרדת עד סוף החודש
}

export const mockMonthlyTrend = [
  { month: 'מרץ', income: 13500, expenses: 9200 },
  { month: 'אפריל', income: 14000, expenses: 8700 },
  { month: 'מאי', income: 13800, expenses: 9500 },
  { month: 'יוני', income: 14500, expenses: 8100 },
  { month: 'יולי', income: 14200, expenses: 9900 },
  { month: 'אוגוסט', income: 14200, expenses: 8500 },
]

export const mockExpenseCategories = [
  { name: 'סופר', amount: 2200, color: '#92400E' },
  { name: 'אוכל ובילויים', amount: 1450, color: '#B45309' },
  { name: 'רכב', amount: 1200, color: '#D97706' },
  { name: 'בית', amount: 1600, color: '#78716C' },
  { name: 'קניות', amount: 850, color: '#A8A29E' },
  { name: 'מנויים', amount: 380, color: '#57534E' },
  { name: 'אחר', amount: 820, color: '#D6D3D1' },
]

export const mockAvailableMoneyTrend = [
  { label: '1', value: 12800 },
  { label: '5', value: 11200 },
  { label: '10', value: 9600 },
  { label: '15', value: 8100 },
  { label: '20', value: 7400 },
  { label: '25', value: 6300 },
  { label: 'היום', value: 5700 },
]

export const mockUpcomingBills = [
  { name: 'חשמל', amount: 320, date: '20/08' },
  { name: 'מים', amount: 140, date: '21/08' },
  { name: 'אשראי', amount: 850, date: '24/08' },
  { name: 'אינטרנט', amount: 89, date: '25/08' },
]

export const mockInvestments = {
  totalValue: 142500,
  changePercent: 3.2,
  trend: [138000, 139500, 140200, 139800, 141000, 140500, 142500],
}

export const mockPension = {
  total: 312000,
  breakdown: [
    { name: 'פנסיה', amount: 210000 },
    { name: 'קרן השתלמות', amount: 78000 },
    { name: 'חיסכון נוסף', amount: 24000 },
  ],
}

export const mockLoans = [{ name: 'משכנתא', balance: 67300, monthlyPayment: 1260, nextPaymentDate: '01/09' }]
