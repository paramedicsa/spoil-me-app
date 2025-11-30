package com.spoilme;

import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;

import androidx.core.content.FileProvider;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "NativeUpdater")
public class NativeUpdater extends Plugin {

    public void downloadAndInstall(final PluginCall call) {
        final String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url is required");
            return;
        }

        // run download on background thread
        new AsyncTask<Void, Void, String>() {
            @Override
            protected String doInBackground(Void... voids) {
                try {
                    URL u = new URL(url);
                    HttpURLConnection c = (HttpURLConnection) u.openConnection();
                    c.setRequestMethod("GET");
                    c.setDoOutput(false);
                    c.connect();
                    if (c.getResponseCode() != HttpURLConnection.HTTP_OK) {
                        return "HTTP error code: " + c.getResponseCode();
                    }

                    InputStream is = c.getInputStream();
                    File outFile = new File(getContext().getFilesDir(), "update.apk");
                    FileOutputStream fos = new FileOutputStream(outFile, false);

                    byte[] buffer = new byte[4096];
                    int len;
                    while ((len = is.read(buffer)) != -1) {
                        fos.write(buffer, 0, len);
                    }

                    fos.flush();
                    fos.close();
                    is.close();
                    c.disconnect();

                    // return absolute path on success
                    return outFile.getAbsolutePath();
                } catch (Exception e) {
                    return "download_error:" + e.getMessage();
                }
            }

            @Override
            protected void onPostExecute(String result) {
                if (result == null) {
                    call.reject("unknown error");
                    return;
                }
                if (result.startsWith("download_error:") || result.startsWith("HTTP error")) {
                    call.reject(result);
                    return;
                }

                try {
                    File apkFile = new File(result);
                    Uri apkUri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apkFile);
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);

                    call.resolve();
                } catch (Exception e) {
                    call.reject("install_error:" + e.getMessage());
                }
            }
        }.execute();
    }
}
