import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateCheckoutBreakdown, formatMoney } from '@/lib/payments'

interface CheckoutSummaryProps {
  currency: string
  entryFee: number
  isPending: boolean
  onCheckout: () => void
}

export function CheckoutSummary({ currency, entryFee, isPending, onCheckout }: CheckoutSummaryProps) {
  const breakdown = calculateCheckoutBreakdown(entryFee)

  return (
    <Card className="border-border bg-card/70">
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
        <CardDescription>Pay securely with Stripe to join this paid game.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Entry fee</span>
            <span className="text-foreground">{formatMoney(breakdown.entryFee, currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Processing fee</span>
            <span className="text-foreground">{formatMoney(breakdown.processingFee, currency)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 font-medium">
            <span>Total</span>
            <span>{formatMoney(breakdown.total, currency)}</span>
          </div>
        </div>

        <Button className="w-full" disabled={isPending} onClick={onCheckout}>
          {isPending ? 'Redirecting to checkout...' : `Pay ${formatMoney(breakdown.total, currency)} and join`}
        </Button>

        <p className="text-xs text-muted-foreground">
          If checkout fails or is cancelled, you can retry from this page.
        </p>
      </CardContent>
    </Card>
  )
}
