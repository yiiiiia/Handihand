package com.kefang.backend.transloadit;

import org.apache.logging.log4j.util.Strings;

import com.transloadit.sdk.Transloadit;
import com.transloadit.sdk.exceptions.LocalOperationException;
import com.transloadit.sdk.exceptions.RequestException;
import com.transloadit.sdk.response.AssemblyResponse;

public class TransloaditClient {

    private static TransloaditClient tsClient;

    private Transloadit transloadit;

    private TransloaditClient() {
        String key = System.getenv("TRANSLOADIT_AUTH_KEY");
        String secret = System.getenv("TRANSLOADIT_AUTH_SECRET");
        if (Strings.isBlank(key)) {
            throw new RuntimeException("env 'TRANSLOADIT_AUTH_KEY' is not set!");
        }
        if (Strings.isBlank(secret)) {
            throw new RuntimeException("env 'TRANSLOADIT_AUTH_SECRET' is not set!");
        }
        transloadit = new Transloadit(key, secret);
    }

    public static TransloaditClient gTransloaditClient() {
        if (tsClient == null) {
            synchronized (TransloaditClient.class) {
                while (tsClient == null) {
                    tsClient = new TransloaditClient();
                }
            }
        }
        return tsClient;
    }

    public AssemblyResponse getAssembly(String assemblyId) throws RequestException, LocalOperationException {
        return transloadit.getAssembly(assemblyId);
    }
}
