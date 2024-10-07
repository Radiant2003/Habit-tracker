use futures::TryStreamExt;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Pool, Sqlite};

use crate::AppState;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Record {
    pub id: u16,
    pub points: i16,
    pub created_at: String,
}

#[tauri::command]
pub async fn get_records(state: tauri::State<'_, AppState>) -> Result<Vec<Record>, ()> {
    let db: &Pool<Sqlite> = &state.db;

    let records: Vec<Record> = sqlx::query_as::<_, Record>("SELECT * FROM records")
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("Failed to get records: {}", e))
        .unwrap();

    Ok(records)
}

#[tauri::command]
pub async fn reset_records(state: tauri::State<'_, AppState>) -> Result<(), ()> {
    let db: &Pool<Sqlite> = &state.db;

    let _ = sqlx::query("DELETE FROM records")
        .execute(db)
        .await
        .map_err(|e| format!("Could not delete records: {}", e));

    Ok(())
}
