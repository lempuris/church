import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, Youtube, MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useThemeStore, type Theme } from '@/store/theme'

const contactInfo = [
  {
    icon: MapPin,
    title: 'Visit Us',
    details: ['123 Grace Street', 'Sandton, Johannesburg', 'Gauteng, 2196'],
  },
  {
    icon: Phone,
    title: 'Call Us',
    details: ['+27 11 234 5678', '+27 82 123 4567 (WhatsApp)'],
  },
  {
    icon: Mail,
    title: 'Email Us',
    details: ['info@thembani.church', 'pastor@thembani.church'],
  },
  {
    icon: Clock,
    title: 'Office Hours',
    details: ['Mon - Fri: 8:00 AM - 5:00 PM', 'Sat: 9:00 AM - 1:00 PM', 'Sun: Services Only'],
  },
]

const socialLinks = [
  { icon: Facebook, name: 'Facebook', href: '#', hoverColor: '#1877f2' },
  { icon: Instagram, name: 'Instagram', href: '#', hoverColor: '#e4405f' },
  { icon: Youtube, name: 'YouTube', href: '#', hoverColor: '#ff0000' },
  { icon: MessageCircle, name: 'WhatsApp', href: '#', hoverColor: '#25d366' },
]

function ContactCard({ item, theme, index }: { 
  item: typeof contactInfo[0]; 
  theme: Theme; 
  index: number;
}) {
  const colors = [
    theme.colors.gradientFrom,
    theme.colors.gradientVia,
    theme.colors.gradientTo,
    theme.colors.primary,
  ]
  const color = colors[index % colors.length]
  const Icon = item.icon
  
  return (
    <Card 
      className="text-center hover:shadow-lg transition-shadow border-t-4"
      style={{ borderTopColor: color }}
    >
      <CardHeader className="pb-2">
        <div 
          className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Icon className="h-7 w-7" />
        </div>
        <CardTitle className="text-lg">{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {item.details.map((detail, idx) => (
          <p key={idx} className="text-muted-foreground text-sm">{detail}</p>
        ))}
      </CardContent>
    </Card>
  )
}

export function Contact() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { getTheme } = useThemeStore()
  const theme = getTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setSubmitted(true)
    setFormState({ name: '', email: '', phone: '', subject: '', message: '' })
    
    // Reset success message after 5 seconds
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section 
        className="relative py-24"
        style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientVia}, ${theme.colors.gradientTo})` }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Get In <span className="text-white/80">Touch</span>
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            We'd love to hear from you. Reach out with questions, prayer requests, or just to say hello!
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {contactInfo.map((item, index) => (
              <ContactCard key={item.title} item={item} theme={theme} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Send Us a Message</h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
              
              {submitted && (
                <div 
                  className="mb-6 p-4 rounded-xl border"
                  style={{ 
                    backgroundColor: `${theme.colors.primary}10`,
                    borderColor: `${theme.colors.primary}30`,
                    color: theme.colors.primary
                  }}
                >
                  <p className="font-medium">Thank you for your message!</p>
                  <p className="text-sm opacity-80">We'll get back to you soon. May God bless you!</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Thabo Mokoena"
                      value={formState.name}
                      onChange={(e) => setFormState(s => ({ ...s, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="thabo@example.com"
                      value={formState.email}
                      onChange={(e) => setFormState(s => ({ ...s, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+27 82 123 4567"
                      value={formState.phone}
                      onChange={(e) => setFormState(s => ({ ...s, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="Prayer Request, General Inquiry, etc."
                      value={formState.subject}
                      onChange={(e) => setFormState(s => ({ ...s, subject: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Your Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help you?"
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState(s => ({ ...s, message: e.target.value }))}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full font-bold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }}
                      />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Message
                    </div>
                  )}
                </Button>
              </form>
            </div>

            {/* Map & Additional Info */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Find Us</h2>
              <p className="text-muted-foreground mb-8">
                Our main campus is located in Sandton, Johannesburg. Parking available.
              </p>
              
              {/* Map Placeholder */}
              <div 
                className="aspect-video rounded-xl mb-8 flex items-center justify-center overflow-hidden relative"
                style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.muted})` }}
              >
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='${encodeURIComponent(theme.colors.primary)}' fill-opacity='0.3' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                  }} />
                </div>
                <div className="text-center z-10">
                  <MapPin className="h-16 w-16 text-primary mx-auto mb-3" />
                  <p className="text-foreground font-medium">123 Grace Street, Sandton</p>
                  <p className="text-muted-foreground text-sm">Johannesburg, Gauteng</p>
                  <Button variant="link" className="mt-2">
                    Open in Google Maps →
                  </Button>
                </div>
              </div>

              {/* Social Media */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Connect With Us</CardTitle>
                  <CardDescription>Follow us on social media for updates and encouragement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {socialLinks.map((social) => {
                      const Icon = social.icon
                      return (
                        <a
                          key={social.name}
                          href={social.href}
                          className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground transition-all hover:scale-110"
                          title={social.name}
                          style={{ }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = social.hoverColor
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = ''
                            e.currentTarget.style.color = ''
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Contact */}
              <div 
                className="mt-6 p-4 rounded-xl"
                style={{ backgroundColor: `${theme.colors.primary}10` }}
              >
                <p className="text-sm text-foreground mb-2">
                  <strong>Need urgent prayer?</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  WhatsApp our prayer line: <a href="tel:+27821234567" className="text-primary font-medium">+27 82 123 4567</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section 
        className="py-20"
        style={{ background: `linear-gradient(135deg, ${theme.colors.muted}, ${theme.colors.secondary}50)` }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: 'What should I expect at my first visit?',
                  a: 'You\'ll be warmly welcomed! Our services are about 90 minutes with contemporary worship, biblical teaching, and times of prayer. Come as you are - dress is smart casual.',
                },
                {
                  q: 'Do you have programs for children?',
                  a: 'Yes! We have Sunday School for children ages 3-12 during our main services, and a youth program for teenagers on Friday evenings.',
                },
                {
                  q: 'How can I join a cell group?',
                  a: 'Contact us through this form or visit our welcome desk on Sunday. We\'ll connect you with a cell group in your area - we have groups across Gauteng!',
                },
                {
                  q: 'Is there parking available?',
                  a: 'Yes, we have ample parking at our Sandton campus. Parking marshals are available to assist you.',
                },
              ].map((faq, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-foreground">{faq.q}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
