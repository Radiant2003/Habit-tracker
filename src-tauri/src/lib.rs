// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sqlx::{Pool, Sqlite};
use tauri::{App, Manager};

mod tauri_commands;
use tauri_commands::*;

mod state;
use state::*;

mod db;
use db::*;

#[tokio::main]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> Result<(), ()> {
    let app: App = tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_cli::init())
        .invoke_handler(tauri::generate_handler![
            create_or_get_user,
            create_habit,
            get_habits,
            update_habit,
            delete_habit,
            update_user_points,
            check_user_update,
            get_records,
            reset_records,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    let db: Pool<Sqlite> = setup_db(&app).await;

    app.manage(AppState { db });
    app.run(|_, _| {});

    Ok(())
}
