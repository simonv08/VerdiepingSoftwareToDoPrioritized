package com.DeGeweldigeXD.ToDoApp;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;

public class TodoWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_NEXT = "com.DeGeweldigeXD.ToDoApp.ACTION_NEXT";
    public static final String ACTION_PREV = "com.DeGeweldigeXD.ToDoApp.ACTION_PREV";
    public static final String ACTION_CHECK = "com.DeGeweldigeXD.ToDoApp.ACTION_CHECK";
    public static final String ACTION_DELETE = "com.DeGeweldigeXD.ToDoApp.ACTION_DELETE";
    
    private static int currentPage = 0;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
        views.setTextViewText(R.id.widget_title, currentPage == 0 ? "Tasks" : "Groceries");

        SharedPreferences prefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE);
        views.setTextViewText(R.id.debug_info, prefs.getString("widget_debug", "Waiting for sync..."));

        Intent serviceIntent = new Intent(context, TodoWidgetService.class);
        serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        serviceIntent.putExtra("page", currentPage);
        serviceIntent.setData(Uri.parse(serviceIntent.toUri(Intent.URI_INTENT_SCHEME)));
        views.setRemoteAdapter(R.id.widget_list, serviceIntent);

        views.setOnClickPendingIntent(R.id.btn_next, getPendingSelfIntent(context, ACTION_NEXT));
        views.setOnClickPendingIntent(R.id.btn_prev, getPendingSelfIntent(context, ACTION_PREV));

        Intent clickIntent = new Intent(context, TodoWidgetProvider.class);
        PendingIntent clickPendingIntent = PendingIntent.getBroadcast(context, 0, clickIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);
        views.setPendingIntentTemplate(R.id.widget_list, clickPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private PendingIntent getPendingSelfIntent(Context context, String action) {
        Intent intent = new Intent(context, TodoWidgetProvider.class);
        intent.setAction(action);
        return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        
        if (ACTION_NEXT.equals(action) || ACTION_PREV.equals(action)) {
            currentPage = (currentPage == 0) ? 1 : 0;
            refreshAll(context);
        } else if (ACTION_CHECK.equals(action) || ACTION_DELETE.equals(action)) {
            String itemId = intent.getStringExtra("itemId");
            if (itemId != null) {
                handleItemAction(context, action, itemId);
            }
        }
    }

    private void handleItemAction(Context context, String action, String itemId) {
        SharedPreferences prefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE);
        String key = (currentPage == 0) ? "widget_tasks_json" : "widget_groceries_json";
        String data = prefs.getString(key, "[]");

        try {
            JSONArray array = new JSONArray(data);
            boolean changed = false;
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                if (itemId.equals(obj.optString("id"))) {
                    if (ACTION_CHECK.equals(action)) {
                        if (currentPage == 0) obj.put("completed", true);
                        else obj.put("bought", true);
                    } else if (ACTION_DELETE.equals(action)) {
                        obj.put("deleted", true);
                    }
                    changed = true;
                    break;
                }
            }

            if (changed) {
                prefs.edit().putString(key, array.toString()).apply();
                refreshAll(context);
                
                // Broadcast to the Plugin so the App can update instantly
                Intent intentUpdate = new Intent("WIDGET_DATA_CHANGED");
                context.sendBroadcast(intentUpdate);

                Toast.makeText(context, ACTION_CHECK.equals(action) ? "Marked as done" : "Deleted from widget", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void refreshAll(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(context, TodoWidgetProvider.class));
        onUpdate(context, mgr, ids);
        mgr.notifyAppWidgetViewDataChanged(ids, R.id.widget_list);
    }
}