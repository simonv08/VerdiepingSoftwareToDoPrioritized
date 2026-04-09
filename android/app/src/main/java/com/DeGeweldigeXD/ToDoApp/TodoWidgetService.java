package com.DeGeweldigeXD.ToDoApp;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class TodoWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new TodoRemoteViewsFactory(this.getApplicationContext(), intent);
    }
}

class TodoRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {
    private final Context context;
    private final int page;
    private List<JSONObject> displayItems = new ArrayList<>();

    public TodoRemoteViewsFactory(Context context, Intent intent) {
        this.context = context;
        this.page = intent.getIntExtra("page", 0);
    }

    @Override
    public void onCreate() {}

    @Override
    public void onDataSetChanged() {
        displayItems.clear();
        SharedPreferences prefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE);
        String key = (page == 0) ? "widget_tasks_json" : "widget_groceries_json";
        String jsonStr = prefs.getString(key, "[]");

        try {
            JSONArray array = new JSONArray(jsonStr);
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                
                // Handle both simple boolean and timestamp strings
                boolean completed = obj.optBoolean("completed", false) || !obj.optString("completedAt", "null").equals("null");
                boolean bought = obj.optBoolean("bought", false) || !obj.optString("boughtAt", "null").equals("null");
                boolean deleted = obj.optBoolean("deleted", false);
                
                if (!completed && !bought && !deleted) {
                    displayItems.add(obj);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDestroy() {
        displayItems.clear();
    }

    @Override
    public int getCount() {
        return displayItems.isEmpty() ? 1 : displayItems.size();
    }

    @Override
    public RemoteViews getViewAt(int position) {
        if (displayItems.isEmpty()) {
            RemoteViews emptyRv = new RemoteViews(context.getPackageName(), R.layout.widget_item);
            emptyRv.setTextViewText(R.id.item_title, page == 0 ? "No active tasks" : "No groceries needed");
            emptyRv.setViewVisibility(R.id.btn_item_check, android.view.View.GONE);
            emptyRv.setViewVisibility(R.id.btn_item_delete, android.view.View.GONE);
            return emptyRv;
        }

        JSONObject item = displayItems.get(position);
        String id = item.optString("id", "");
        String title = item.optString("title", item.optString("name", "Item"));

        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_item);
        rv.setTextViewText(R.id.item_title, title);
        rv.setViewVisibility(R.id.btn_item_check, android.view.View.VISIBLE);
        rv.setViewVisibility(R.id.btn_item_delete, android.view.View.VISIBLE);

        Bundle checkExtras = new Bundle();
        checkExtras.putString("itemId", id);
        Intent checkIntent = new Intent();
        checkIntent.setAction(TodoWidgetProvider.ACTION_CHECK);
        checkIntent.putExtras(checkExtras);
        rv.setOnClickFillInIntent(R.id.btn_item_check, checkIntent);

        Bundle deleteExtras = new Bundle();
        deleteExtras.putString("itemId", id);
        Intent deleteIntent = new Intent();
        deleteIntent.setAction(TodoWidgetProvider.ACTION_DELETE);
        deleteIntent.putExtras(deleteExtras);
        rv.setOnClickFillInIntent(R.id.btn_item_delete, deleteIntent);

        return rv;
    }

    @Override
    public RemoteViews getLoadingView() { return null; }
    @Override
    public int getViewTypeCount() { return 1; }
    @Override
    public long getItemId(int position) { return position; }
    @Override
    public boolean hasStableIds() { return true; }
}