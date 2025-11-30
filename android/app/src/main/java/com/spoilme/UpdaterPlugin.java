package com.spoilme;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Environment;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;

@CapacitorPlugin(name = "UpdaterPlugin")
public class UpdaterPlugin extends Plugin {

    @Override
    public void load() {
        super.load();
    }

    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url required");
            return;
        }

        Context ctx = getContext();
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("Downloading app update");
            request.setDescription("Downloading update...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE);
            request.setDestinationInExternalFilesDir(ctx, Environment.DIRECTORY_DOWNLOADS, "app-update.apk");

            DownloadManager dm = (DownloadManager) ctx.getSystemService(Context.DOWNLOAD_SERVICE);
            long downloadId = dm.enqueue(request);

            BroadcastReceiver onComplete = new BroadcastReceiver() {
                @Override
                public void onReceive(Context ctxt, Intent intent) {
                    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (id != downloadId) return;

                    // Locate the file
                    File file = new File(ctx.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "app-update.apk");
                    if (!file.exists()) {
                        call.reject("Downloaded file not found");
                        return;
                    }

                    Uri contentUri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", file);
                    Intent install = new Intent(Intent.ACTION_VIEW);
                    install.setDataAndType(contentUri, "application/vnd.android.package-archive");
                    install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(install);

                    call.resolve();
                    // unregister receiver
                    try {
                        ctx.unregisterReceiver(this);
                    } catch (Exception e) {
                        // ignore
                    }
                }
            };

            ctx.registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));

        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
