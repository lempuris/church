import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Heart, CreditCard, Smartphone, Building2, Banknote, AlertCircle, CheckCircle2, Gift, Users, Globe } from 'lucide-react'

import { useThemeStore } from '@/store/theme'
import { donationService } from '@/services'

type PaymentMethod = 'card' | 'snapscan' | 'bank_transfer' | 'cash'

const impactStats = [
  { icon: Users, label: 'Families Supported', value: '250+' },
  { icon: Gift, label: 'Community Meals', value: '1,000+' },
  { icon: Globe, label: 'Mission Partners', value: '12' },
]

const bankDetails = {
  bankName: 'First National Bank (FNB)',
  accountName: 'Glory House',
  accountNumber: '62845678901',
  branchCode: '250655',
  swiftCode: 'FIABORNJXXX',
  reference: 'TITHE-[Your Name]',
}

export function Giving() {
  const { getTheme } = useThemeStore()
  const theme = getTheme()
  const isDarkTheme = theme.id === 'midnight-gold' || theme.id === 'northern-lights'

  const [formData, setFormData] = useState({
    amount: '',
    customAmount: '',
    category_id: '',
    payment_method: 'card' as PaymentMethod,
    donor_name: '',
    donor_email: '',
    is_recurring: false,
  })
  const [submitted, setSubmitted] = useState(false)

  const presetAmounts = [100, 250, 500, 1000, 2500, 5000]

  const { data: categories } = useQuery({
    queryKey: ['donation-categories-public'],
    queryFn: () => donationService.getCategories(true),
  })

  const { data: paymentStatus } = useQuery({
    queryKey: ['payment-status-public'],
    queryFn: () => donationService.getPaymentStatus(),
    retry: false,
  })

  const isOnlinePaymentConfigured = paymentStatus?.is_configured ?? false

  const handleAmountSelect = (amount: number) => {
    setFormData({ ...formData, amount: amount.toString(), customAmount: '' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For demo - show success state
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 5000)
  }

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'card': return CreditCard
      case 'snapscan': return Smartphone
      case 'bank_transfer': return Building2
      case 'cash': return Banknote
    }
  }

  const finalAmount = formData.customAmount || formData.amount

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* Hero Section */}
      <section 
        className="relative py-20 overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientVia}, ${theme.colors.gradientTo})` 
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <Heart className="h-5 w-5" />
              <span className="text-sm font-medium">Give with a Generous Heart</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Partner with Us in Ministry
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Your generosity enables us to spread the Gospel, support our community, 
              and make a lasting impact in South Africa and beyond. Every gift matters.
            </p>
            <p className="text-lg text-white/80 italic">
              "Each of you should give what you have decided in your heart to give, 
              not reluctantly or under compulsion, for God loves a cheerful giver."
              <span className="block mt-2 text-sm not-italic">— 2 Corinthians 9:7</span>
            </p>
          </div>
        </div>
        
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill={theme.colors.background}
            />
          </svg>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-12 -mt-8 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {impactStats.map((stat) => (
              <div 
                key={stat.label}
                className="text-center p-4 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: isDarkTheme ? theme.colors.card : 'white',
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                }}
              >
                <stat.icon 
                  className="h-8 w-8 mx-auto mb-2" 
                  style={{ color: theme.colors.primary }} 
                />
                <div 
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.foreground }}
                >
                  {stat.value}
                </div>
                <div 
                  className="text-xs"
                  style={{ color: theme.colors.mutedForeground }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            
            {/* Donation Form */}
            <div 
              className="rounded-2xl p-8 shadow-xl"
              style={{ 
                backgroundColor: isDarkTheme ? theme.colors.card : 'white',
                borderColor: theme.colors.border,
                borderWidth: 1,
              }}
            >
              <h2 
                className="text-2xl font-bold mb-6"
                style={{ color: theme.colors.foreground }}
              >
                Make a Donation
              </h2>

              {/* Online Payment Status Banner */}
              {!isOnlinePaymentConfigured && (
                <div 
                  className="flex items-start gap-3 p-4 rounded-lg mb-6"
                  style={{ 
                    backgroundColor: `${theme.colors.primary}10`,
                    borderColor: theme.colors.primary,
                    borderWidth: 1,
                  }}
                >
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
                  <div>
                    <p className="font-medium" style={{ color: theme.colors.primary }}>
                      Online Payments Coming Soon
                    </p>
                    <p className="text-sm mt-1" style={{ color: theme.colors.mutedForeground }}>
                      Card payments will be available shortly. For now, please use bank transfer or SnapScan.
                    </p>
                  </div>
                </div>
              )}

              {submitted ? (
                <div className="text-center py-12">
                  <div 
                    className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${theme.colors.primary}20` }}
                  >
                    <CheckCircle2 className="h-8 w-8" style={{ color: theme.colors.primary }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.foreground }}>
                    Thank You for Your Generosity!
                  </h3>
                  <p style={{ color: theme.colors.mutedForeground }}>
                    Your gift of R{finalAmount} will make a difference. 
                    {formData.payment_method === 'bank_transfer' && ' Please complete the bank transfer using the details provided.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Amount Selection */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-3"
                      style={{ color: theme.colors.foreground }}
                    >
                      Select Amount (ZAR)
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {presetAmounts.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => handleAmountSelect(amount)}
                          className="py-3 rounded-lg font-semibold transition-all"
                          style={{
                            backgroundColor: formData.amount === amount.toString() && !formData.customAmount
                              ? theme.colors.primary
                              : `${theme.colors.primary}10`,
                            color: formData.amount === amount.toString() && !formData.customAmount
                              ? 'white'
                              : theme.colors.primary,
                          }}
                        >
                          R{amount.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      placeholder="Or enter custom amount"
                      value={formData.customAmount}
                      onChange={(e) => setFormData({ ...formData, customAmount: e.target.value, amount: '' })}
                      className="w-full px-4 py-3 rounded-lg text-lg"
                      style={{
                        backgroundColor: isDarkTheme ? theme.colors.background : '#f9fafb',
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        color: theme.colors.foreground,
                      }}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.colors.foreground }}
                    >
                      Giving Category
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg"
                      style={{
                        backgroundColor: isDarkTheme ? theme.colors.background : '#f9fafb',
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        color: theme.colors.foreground,
                      }}
                    >
                      <option value="">Select a category</option>
                      {categories?.items.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-3"
                      style={{ color: theme.colors.foreground }}
                    >
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['card', 'snapscan', 'bank_transfer', 'cash'] as PaymentMethod[]).map((method) => {
                        const Icon = getPaymentIcon(method)
                        const isDisabled = method === 'card' && !isOnlinePaymentConfigured
                        const labels: Record<PaymentMethod, string> = {
                          card: 'Credit/Debit Card',
                          snapscan: 'SnapScan',
                          bank_transfer: 'Bank Transfer',
                          cash: 'Cash (In Person)',
                        }
                        return (
                          <button
                            key={method}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setFormData({ ...formData, payment_method: method })}
                            className="flex items-center gap-3 p-4 rounded-lg transition-all text-left relative"
                            style={{
                              backgroundColor: formData.payment_method === method
                                ? `${theme.colors.primary}15`
                                : isDarkTheme ? theme.colors.background : '#f9fafb',
                              borderColor: formData.payment_method === method
                                ? theme.colors.primary
                                : theme.colors.border,
                              borderWidth: 2,
                              opacity: isDisabled ? 0.5 : 1,
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <Icon 
                              className="h-5 w-5" 
                              style={{ color: formData.payment_method === method ? theme.colors.primary : theme.colors.mutedForeground }} 
                            />
                            <span 
                              className="text-sm font-medium"
                              style={{ color: formData.payment_method === method ? theme.colors.primary : theme.colors.foreground }}
                            >
                              {labels[method]}
                            </span>
                            {isDisabled && (
                              <span 
                                className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: theme.colors.muted, color: theme.colors.mutedForeground }}
                              >
                                Soon
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Donor Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.colors.foreground }}
                      >
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={formData.donor_name}
                        onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                        placeholder="Thabo Mokoena"
                        className="w-full px-4 py-3 rounded-lg"
                        style={{
                          backgroundColor: isDarkTheme ? theme.colors.background : '#f9fafb',
                          borderColor: theme.colors.border,
                          borderWidth: 1,
                          color: theme.colors.foreground,
                        }}
                      />
                    </div>
                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.colors.foreground }}
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.donor_email}
                        onChange={(e) => setFormData({ ...formData, donor_email: e.target.value })}
                        placeholder="thabo@email.com"
                        className="w-full px-4 py-3 rounded-lg"
                        style={{
                          backgroundColor: isDarkTheme ? theme.colors.background : '#f9fafb',
                          borderColor: theme.colors.border,
                          borderWidth: 1,
                          color: theme.colors.foreground,
                        }}
                      />
                    </div>
                  </div>

                  {/* Recurring Option */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                      className="h-5 w-5 rounded"
                      style={{ accentColor: theme.colors.primary }}
                    />
                    <span style={{ color: theme.colors.foreground }}>
                      Make this a monthly recurring donation
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!finalAmount}
                    className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all hover:opacity-90 disabled:opacity-50 shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})` 
                    }}
                  >
                    {finalAmount ? `Give R${Number(finalAmount).toLocaleString()}` : 'Enter Amount to Give'}
                  </button>

                  <p className="text-center text-sm" style={{ color: theme.colors.mutedForeground }}>
                    Your donation is secure and encrypted. You'll receive a receipt via email.
                  </p>
                </form>
              )}
            </div>

            {/* Bank Details & Info */}
            <div className="space-y-8">
              {/* Bank Transfer Details */}
              <div 
                className="rounded-2xl p-8 shadow-xl"
                style={{ 
                  backgroundColor: isDarkTheme ? theme.colors.card : 'white',
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="h-12 w-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${theme.colors.primary}15` }}
                  >
                    <Building2 className="h-6 w-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: theme.colors.foreground }}>
                      Bank Transfer Details
                    </h3>
                    <p className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                      For EFT and direct deposits
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(bankDetails).map(([key, value]) => (
                    <div 
                      key={key} 
                      className="flex justify-between items-center py-3 border-b"
                      style={{ borderColor: theme.colors.border }}
                    >
                      <span 
                        className="text-sm capitalize"
                        style={{ color: theme.colors.mutedForeground }}
                      >
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span 
                        className="font-mono font-medium"
                        style={{ color: theme.colors.foreground }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-sm" style={{ color: theme.colors.mutedForeground }}>
                  Please use your name as reference so we can acknowledge your gift.
                </p>
              </div>

              {/* SnapScan */}
              <div 
                className="rounded-2xl p-8 shadow-xl"
                style={{ 
                  backgroundColor: isDarkTheme ? theme.colors.card : 'white',
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="h-12 w-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#00a8e815' }}
                  >
                    <Smartphone className="h-6 w-6" style={{ color: '#00a8e8' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: theme.colors.foreground }}>
                      SnapScan
                    </h3>
                    <p className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                      Scan to pay with your phone
                    </p>
                  </div>
                </div>
                <p style={{ color: theme.colors.foreground }}>
                  SnapCode: <span className="font-mono font-bold">GloryHouse</span>
                </p>
                <p className="mt-2 text-sm" style={{ color: theme.colors.mutedForeground }}>
                  Open SnapScan app, scan our QR code at the church, or search for "Glory House"
                </p>
              </div>

              {/* In-Person */}
              <div 
                className="rounded-xl p-6"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.gradientFrom}20, ${theme.colors.gradientTo}20)`,
                  borderColor: theme.colors.primary,
                  borderWidth: 1,
                }}
              >
                <h4 className="font-bold mb-2" style={{ color: theme.colors.foreground }}>
                  Give In Person
                </h4>
                <p className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                  Cash and card donations can be made during our Sunday services. 
                  Our ushers will be happy to assist you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Give Section */}
      <section 
        className="py-20"
        style={{ backgroundColor: isDarkTheme ? theme.colors.card : '#f9fafb' }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 
              className="text-3xl font-bold mb-6"
              style={{ color: theme.colors.foreground }}
            >
              Your Gift Makes a Difference
            </h2>
            <p
              className="text-lg leading-relaxed mb-8"
              style={{ color: theme.colors.mutedForeground }}
            >
              Every donation to Glory House goes directly into ministry work —
              from supporting families in need, to funding youth programs,
              to sending missionaries across Africa. We are committed to
              transparency and stewardship of your generous gifts.
            </p>
            <div 
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: theme.colors.primary }}
            >
              <Heart className="h-4 w-4" />
              <span>Siyabonga kakhulu — Thank you so much!</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
