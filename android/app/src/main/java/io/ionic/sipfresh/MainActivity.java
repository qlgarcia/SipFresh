package io.ionic.sipfresh;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		// Enable remote debugging of WebView contents so you can inspect the WebView from a desktop
		// (Chrome -> More tools -> Remote devices). This is safe for debugging; remove or gate
		// behind a debug flag for production builds if desired.
		WebView.setWebContentsDebuggingEnabled(true);
	}
}
