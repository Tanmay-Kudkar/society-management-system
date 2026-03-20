import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentApi } from '../../../api'

/**
 * Custom hook for Razorpay payment integration
 * 
 * Usage:
 * const { initiatePayment, isLoading, error } = useRazorpay({
 *   onSuccess: (paymentData) => console.log('Payment successful!', paymentData),
 *   onError: (error) => console.error('Payment failed', error),
 * })
 * 
 * // Initiate payment
 * initiatePayment({
 *   amount: 5000, // in rupees
 *   maintenanceBillId: 123,
 *   userId: user.id,
 *   description: 'Maintenance Bill - January 2026',
 * })
 */
export function useRazorpay({ onSuccess, onError, onDismiss } = {}) {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Mutation to create order
  const createOrderMutation = useMutation({
    mutationFn: (data) => paymentApi.createOrder(data),
  })

  // Mutation to verify payment
  const verifyPaymentMutation = useMutation({
    mutationFn: (data) => paymentApi.verifyPayment(data),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['maintenanceBills'])
      queryClient.invalidateQueries(['payments'])
      queryClient.invalidateQueries(['transactions'])
    },
  })

  // Mutation to handle failure
  const handleFailureMutation = useMutation({
    mutationFn: ({ paymentId, errorCode, errorDescription }) => 
      paymentApi.handleFailure(paymentId, errorCode, errorDescription),
  })

  const handleCancelMutation = useMutation({
    mutationFn: ({ paymentId, reason }) => paymentApi.handleCancel(paymentId, reason),
  })

  const initiatePayment = useCallback(async ({
    amount,
    maintenanceBillId,
    userId,
    description,
    paymentType = 'MAINTENANCE',
    prefill = {},
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Create order on backend
      const orderResponse = await createOrderMutation.mutateAsync({
        amount,
        maintenanceBillId,
        userId,
        description,
        paymentType,
      })

      const orderData = orderResponse.data

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100, // Razorpay expects amount in paise
        currency: orderData.currency,
        name: 'SocietyHub',
        description: orderData.description || 'Payment',
        order_id: orderData.orderId,
        receipt: orderData.receipt,
        prefill: {
          name: prefill.name || orderData.customerName || '',
          email: prefill.email || orderData.customerEmail || '',
          contact: prefill.phone || orderData.customerPhone || '',
        },
        theme: {
          color: '#6366f1', // Indigo color to match the app theme
        },
        handler: async function (response) {
          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await verifyPaymentMutation.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentId: orderData.paymentId,
            })

            setIsLoading(false)
            onSuccess?.(verifyResponse.data)
          } catch (verifyError) {
            setIsLoading(false)
            setError(verifyError.message || 'Payment verification failed')
            onError?.(verifyError)
          }
        },
        modal: {
          ondismiss: async function () {
            try {
              await handleCancelMutation.mutateAsync({
                paymentId: orderData.paymentId,
                reason: 'Checkout closed by user',
              })
              queryClient.invalidateQueries(['payments'])
            } catch (cancelError) {
              console.error('Failed to record payment cancellation:', cancelError)
            }
            setIsLoading(false)
            onDismiss?.(orderData.paymentId)
          },
          escape: true,
          confirm_close: true,
        },
      }

      // Check if Razorpay is loaded
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.')
      }

      const razorpayInstance = new window.Razorpay(options)

      razorpayInstance.on('payment.failed', async function (response) {
        // Handle payment failure
        try {
          await handleFailureMutation.mutateAsync({
            paymentId: orderData.paymentId,
            errorCode: response.error.code,
            errorDescription: response.error.description,
          })
        } catch (e) {
          console.error('Failed to record payment failure:', e)
        }

        setIsLoading(false)
        setError(response.error.description || 'Payment failed')
        onError?.(response.error)
      })

      razorpayInstance.open()
    } catch (err) {
      setIsLoading(false)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initiate payment'
      setError(errorMessage)
      onError?.(err)
    }
  }, [createOrderMutation, verifyPaymentMutation, handleFailureMutation, handleCancelMutation, onSuccess, onError, onDismiss, queryClient])

  return {
    initiatePayment,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}

export default useRazorpay
