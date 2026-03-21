package com.society.backend.common.security;

import com.society.backend.common.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class DocumentMetadataCryptoService {

    private static final String VERSION = "v1";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int IV_LENGTH_BYTES = 12;

    private final byte[] key;

    public DocumentMetadataCryptoService(@Value("${security.document-metadata.encryption-secret:change-me}") String secret) {
        this.key = deriveKey(secret);
    }

    public String currentVersion() {
        return VERSION;
    }

    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] cipherBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            return VERSION + ":" +
                    Base64.getEncoder().encodeToString(iv) + ":" +
                    Base64.getEncoder().encodeToString(cipherBytes);
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to encrypt document metadata");
        }
    }

    public String decrypt(String encryptedPayload) {
        if (encryptedPayload == null || encryptedPayload.isBlank()) {
            return null;
        }
        try {
            String[] parts = encryptedPayload.split(":", 3);
            if (parts.length != 3) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid encrypted metadata payload");
            }
            String version = parts[0];
            if (!VERSION.equals(version)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported metadata encryption version");
            }

            byte[] iv = Base64.getDecoder().decode(parts[1]);
            byte[] cipherBytes = Base64.getDecoder().decode(parts[2]);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] plainBytes = cipher.doFinal(cipherBytes);
            return new String(plainBytes, StandardCharsets.UTF_8);
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Failed to decrypt document metadata");
        }
    }

    private byte[] deriveKey(String secret) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(secret.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to initialize metadata encryption");
        }
    }
}
