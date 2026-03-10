package com.society.backend.common.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RazorpayConfig {

    @Getter
    @Value("${razorpay.key.id:}")
    private String keyId;

    @Value("${razorpay.key.secret:}")
    private String keySecret;

    @Getter
    @Value("${razorpay.currency:INR}")
    private String currency;

    /** Internal access only — not exposed via class-level @Getter to prevent accidental serialization */
    public String getKeySecret() {
        return keySecret;
    }

    @Bean
    @ConditionalOnExpression("'${razorpay.key.id:}' != '' and '${razorpay.key.secret:}' != ''")
    public RazorpayClient razorpayClient() throws RazorpayException {
        return new RazorpayClient(keyId, keySecret);
    }
}
