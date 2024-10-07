use futures::TryStreamExt;
use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::{prelude::FromRow, Pool, Sqlite};
use std::fmt::Debug;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Habit {
    pub id: u16,
    pub habit_name: String,
    pub points: i16,
}

#[tauri::command]
pub async fn create_habit(
    state: tauri::State<'_, AppState>,
    habit: &str,
) -> Result<Vec<Habit>, ()> {
    let db: &Pool<Sqlite> = &state.db;

    let json_habit: Habit = serde_json::from_str::<Habit>(habit).unwrap();

    let _ = sqlx::query("INSERT INTO habits (habit_name, points) VALUES (?1, ?2)")
        .bind(json_habit.habit_name)
        .bind(json_habit.points)
        .execute(db)
        .await
        .map_err(|e| format!("Error saving habit: {}", e));

    let habits: Vec<Habit> = sqlx::query_as::<_, Habit>("SELECT * FROM habits")
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("Failed to get habits: {}", e))
        .unwrap();

    Ok(habits)
}

#[tauri::command]
pub async fn get_habits(state: tauri::State<'_, AppState>) -> Result<Vec<Habit>, ()> {
    let db: &Pool<Sqlite> = &state.db;

    let habits: Vec<Habit> = sqlx::query_as::<_, Habit>("SELECT * FROM habits")
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("Failed to get habits: {}", e))
        .unwrap();

    Ok(habits)
}

#[tauri::command]
pub async fn update_habit(
    state: tauri::State<'_, AppState>,
    habit: &str,
) -> Result<Vec<Habit>, ()> {
    let db: &Pool<Sqlite> = &state.db;

    let json_habit: Habit = serde_json::from_str::<Habit>(habit).unwrap();

    let _ = sqlx::query("UPDATE habits SET habit_name = ?1, points = ?2 WHERE id = ?3")
        .bind(json_habit.habit_name)
        .bind(json_habit.points)
        .bind(json_habit.id)
        .execute(db)
        .await
        .map_err(|e| format!("could not update habit {}", e));

    let edited_habit: Vec<Habit> = sqlx::query_as::<_, Habit>("SELECT * FROM habits WHERE id = ?1")
        .bind(json_habit.id)
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("Failed to get habits: {}", e))
        .unwrap();

    Ok(edited_habit)
}

#[tauri::command]
pub async fn delete_habit(state: tauri::State<'_, AppState>, id: u16) -> Result<Vec<Habit>, ()> {
    let db: &Pool<Sqlite> = &state.db;

    let _ = sqlx::query("DELETE FROM habits WHERE id = ?1")
        .bind(id)
        .execute(db)
        .await
        .map_err(|e| format!("could not delete habit {}", e));

    let habits: Vec<Habit> = sqlx::query_as::<_, Habit>("SELECT * FROM habits")
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("Failed to get habits: {}", e))
        .unwrap();

    Ok(habits)
}
