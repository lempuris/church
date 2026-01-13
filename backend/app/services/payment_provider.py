"""Payment provider abstraction for future Stripe integration.

This module provides an abstract interface for payment providers and a stubbed
Stripe implementation that returns "not configured" errors until Stripe
credentials are added.

When Stripe is ready:
1. Add STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET to environment
2. Implement the actual Stripe API calls in StripePaymentProvider
3. The rest of the codebase remains unchanged
"""

from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any

from app.core.config import settings


class PaymentProviderError(Exception):
    """Base exception for payment provider errors."""

    pass


class PaymentNotConfiguredError(PaymentProviderError):
    """Raised when payment provider is not configured."""

    pass


class PaymentProcessingError(PaymentProviderError):
    """Raised when payment processing fails."""

    pass


class PaymentProvider(ABC):
    """Abstract base class for payment providers."""

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if the provider is configured and ready."""
        pass

    @abstractmethod
    def get_status(self) -> dict:
        """Get provider status and supported methods."""
        pass

    @abstractmethod
    def create_payment_intent(
        self,
        amount: Decimal,
        currency: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict:
        """Create a payment intent for one-time donations."""
        pass

    @abstractmethod
    def confirm_payment(self, payment_intent_id: str) -> dict:
        """Confirm a payment intent."""
        pass

    @abstractmethod
    def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict:
        """Create a recurring donation subscription."""
        pass

    @abstractmethod
    def cancel_subscription(self, subscription_id: str) -> dict:
        """Cancel a recurring donation subscription."""
        pass

    @abstractmethod
    def create_customer(
        self,
        email: str,
        name: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict:
        """Create a customer for recurring donations."""
        pass

    @abstractmethod
    def handle_webhook(self, payload: bytes, signature: str) -> dict:
        """Handle incoming webhook from payment provider."""
        pass


class StripePaymentProvider(PaymentProvider):
    """Stripe payment provider implementation.

    Currently stubbed - returns "not configured" errors until Stripe
    credentials are added to environment variables.

    To enable Stripe:
    1. Set STRIPE_API_KEY environment variable
    2. Set STRIPE_WEBHOOK_SECRET environment variable
    3. Optionally set STRIPE_PUBLISHABLE_KEY for frontend
    """

    def __init__(self):
        self.api_key = getattr(settings, "STRIPE_API_KEY", None)
        self.webhook_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", None)

    def is_configured(self) -> bool:
        """Check if Stripe credentials are configured."""
        return bool(self.api_key and self.webhook_secret)

    def get_status(self) -> dict:
        """Get Stripe provider status."""
        if not self.is_configured():
            return {
                "provider": "stripe",
                "is_configured": False,
                "is_enabled": False,
                "supported_methods": [],
                "message": (
                    "Online payments are not yet configured. "
                    "Add STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET environment variables "
                    "to enable online donations."
                ),
            }
        return {
            "provider": "stripe",
            "is_configured": True,
            "is_enabled": True,
            "supported_methods": ["card"],
            "message": None,
        }

    def _require_configured(self) -> None:
        """Raise error if not configured."""
        if not self.is_configured():
            raise PaymentNotConfiguredError(
                "Online payments are not yet configured. "
                "Please add STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET "
                "environment variables to enable online donations."
            )

    def create_payment_intent(
        self,
        amount: Decimal,
        currency: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict:
        """Create a Stripe payment intent.

        When Stripe is configured, this would call:
        ```python
        import stripe
        stripe.api_key = self.api_key

        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Stripe uses cents
            currency=currency.lower(),
            metadata=metadata or {},
        )
        return {
            "id": intent.id,
            "client_secret": intent.client_secret,
            "status": intent.status,
        }
        ```
        """
        self._require_configured()
        # Placeholder - would call Stripe API when configured
        raise PaymentNotConfiguredError(
            "Online payments are not yet available. "
            "Please use manual donation recording for now."
        )

    def confirm_payment(self, payment_intent_id: str) -> dict:
        """Confirm a Stripe payment intent.

        When Stripe is configured, this would call:
        ```python
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return {
            "id": intent.id,
            "status": intent.status,
            "amount": intent.amount / 100,
            "currency": intent.currency,
        }
        ```
        """
        self._require_configured()
        raise PaymentNotConfiguredError("Online payments are not yet available.")

    def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict:
        """Create a Stripe subscription for recurring donations.

        When Stripe is configured, this would call:
        ```python
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": price_id}],
            metadata=metadata or {},
        )
        return {
            "id": subscription.id,
            "status": subscription.status,
            "current_period_end": subscription.current_period_end,
        }
        ```
        """
        self._require_configured()
        raise PaymentNotConfiguredError(
            "Recurring online donations are not yet available."
        )

    def cancel_subscription(self, subscription_id: str) -> dict:
        """Cancel a Stripe subscription.

        When Stripe is configured, this would call:
        ```python
        subscription = stripe.Subscription.delete(subscription_id)
        return {
            "id": subscription.id,
            "status": subscription.status,
        }
        ```
        """
        self._require_configured()
        raise PaymentNotConfiguredError(
            "Recurring online donations are not yet available."
        )

    def create_customer(
        self,
        email: str,
        name: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict:
        """Create a Stripe customer.

        When Stripe is configured, this would call:
        ```python
        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata=metadata or {},
        )
        return {
            "id": customer.id,
            "email": customer.email,
        }
        ```
        """
        self._require_configured()
        raise PaymentNotConfiguredError(
            "Online payment customer creation is not yet available."
        )

    def handle_webhook(self, payload: bytes, signature: str) -> dict:
        """Handle Stripe webhook events.

        When Stripe is configured, this would:
        ```python
        event = stripe.Webhook.construct_event(
            payload, signature, self.webhook_secret
        )
        return {
            "event_type": event.type,
            "data": event.data.object,
        }
        ```
        """
        self._require_configured()
        raise PaymentNotConfiguredError("Webhook handling is not yet available.")


def get_payment_provider() -> PaymentProvider:
    """Factory function to get the payment provider.

    Currently returns StripePaymentProvider. In the future, this could
    be extended to support multiple providers based on configuration.
    """
    return StripePaymentProvider()
