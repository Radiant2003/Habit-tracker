use chrono::Local;
use futures::TryStreamExt;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Pool, Sqlite};
use std::{
    cmp::max_by,
    fmt::Debug,
    time::{SystemTime, UNIX_EPOCH},
};

use crate::AppState;

use crate::Record;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: u16,
    pub points: i16,
    pub updated_at: i64,
}

#[tauri::command]
pub async fn create_or_get_user(state: tauri::State<'_, AppState>) -> Result<Vec<User>, String> {
    let db: &Pool<Sqlite> = &state.db;

    let existing_users: Vec<User> = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?1")
        .bind(1)
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("could not get users: {}", e))
        .unwrap();

    if existing_users.len() == 0 {
        sqlx::query("INSERT INTO users (points, updated_at) VALUES (?1, ?2)")
            .bind(0)
            .bind(
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as i64,
            )
            .execute(db)
            .await
            .map_err(|e| format!("could not create user: {}", e))
            .unwrap();

        let new_users: Vec<User> = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?1")
            .bind(1)
            .fetch(db)
            .try_collect()
            .await
            .map_err(|e| format!("could not get users: {}", e))
            .unwrap();

        return Ok(new_users);
    }

    Ok(existing_users)
}

#[tauri::command]
pub async fn update_user_points(
    state: tauri::State<'_, AppState>,
    points: i16,
) -> Result<i16, String> {
    let db: &Pool<Sqlite> = &state.db;

    let users: Vec<User> = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?1")
        .bind(1)
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("could not get users: {}", e))
        .unwrap();

    let new_points: i16 = max_by(users[0].points + points, 0, |x: &i16, y: &i16| x.cmp(&y));

    let now: String = Local::now().date_naive().format("%d %b %Y").to_string();

    let today_record: Vec<Record> =
        sqlx::query_as::<_, Record>("SELECT * FROM records WHERE created_at = ?1")
            .bind(now.clone())
            .fetch(db)
            .try_collect()
            .await
            .map_err(|e| format!("could not select today records: {}", e))
            .unwrap();

    if today_record.len() == 0 {
        let _ = sqlx::query("INSERT INTO records(points, created_at) VALUES(?1, ?2)")
            .bind(points)
            .bind(now)
            .execute(db)
            .await
            .map_err(|e| format!("Error inserting records {}", e));
    } else {
        let _ = sqlx::query("UPDATE records SET points = ?1 WHERE created_at = ?2")
            .bind(today_record[0].points + points)
            .bind(now)
            .execute(db)
            .await
            .map_err(|e| format!("Error updating the record: {}", e));
    }

    let _ = sqlx::query("UPDATE users SET points = ?1 WHERE id = ?2")
        .bind(new_points)
        .bind(users[0].id)
        .execute(db)
        .await
        .map_err(|e| format!("could not update points: {}", e));

    Ok(new_points)
}

#[tauri::command]
pub async fn check_user_update(
    state: tauri::State<'_, AppState>,
    league_entry_points: i16,
) -> Result<i16, ()> {
    let db: &Pool<Sqlite> = &state.db;

    let users: Vec<User> = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?1")
        .bind(1)
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("could not get users: {}", e))
        .unwrap();

    let now: i64 = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;

    if (users[0].updated_at + 8640000) < now {
        let days_inactive: i16 = ((now - users[0].updated_at) / 8640000) as i16;

        let new_points: i16 = max_by(
            users[0].points - days_inactive * league_entry_points,
            0,
            |x: &i16, y: &i16| x.cmp(&y),
        );

        let _ = sqlx::query("UPDATE users SET points = ?1, updated_at = ?2 WHERE id = ?3")
            .bind(new_points)
            .bind(now)
            .bind(users[0].id)
            .execute(db)
            .await
            .map_err(|e| format!("could not update points: {}", e));

        return Ok(new_points);
    }

    Ok(users[0].points)
}
