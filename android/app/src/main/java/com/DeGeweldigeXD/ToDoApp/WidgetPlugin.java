package com.DeGeweldigeXD.ToDoApp;

import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.Toast;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(name = "WidgetPlugin")
public class WidgetPlugin extends Plugin {
    private BroadcastReceiver receiver;

    @Override
    public void load() {
        super.load();
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if ("WIDGET_DATA_CHANGED".equals(intent.getAction())) {
                    JSObject data = new JSObject();
                    data.put("updated", true);
                    notifyListeners("widgetUpdate", data);
                }
            }
        };
        IntentFilter filter = new IntentFilter("WIDGET_DATA_CHANGED");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            getContext().registerReceiver(receiver, filter);
        }
    }

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        String tasksJson = call.getString("tasks", "[]");
        String groceriesJson = call.getString("groceries", "[]");
        Context context = getContext();
        
        SharedPreferences prefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE);
        String time = new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date());
        
        prefs.edit()
            .putString("widget_tasks_json", tasksJson)
            .putString("widget_groceries_json", groceriesJson)
            .putString("widget_debug", "Synced at " + time)
            .apply();
        
        refreshWidgets(context);

        call.resolve();
    }

    @PluginMethod
    public void getWidgetData(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE);
        
        JSObject ret = new JSObject();
        ret.put("tasks", prefs.getString("widget_tasks_json", "[]"));
        ret.put("groceries", prefs.getString("widget_groceries_json", "[]"));
        call.resolve(ret);
    }

    private void refreshWidgets(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(context, TodoWidgetProvider.class));
        
        Intent updateIntent = new Intent(context, TodoWidgetProvider.class);
        updateIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        updateIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        context.sendBroadcast(updateIntent);
        
        mgr.notifyAppWidgetViewDataChanged(ids, R.id.widget_list);
    }
}