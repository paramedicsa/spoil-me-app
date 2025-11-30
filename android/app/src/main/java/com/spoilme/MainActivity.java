package com.spoilme;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.spoilme.NativeUpdater;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Register the native updater plugin
        registerPlugin(NativeUpdater.class);
    }
}
