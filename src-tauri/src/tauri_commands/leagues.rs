use futures::TryStreamExt;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Pool, Sqlite};
use std::fmt::Debug;

use crate::AppState;
use super::users::*;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct League {
    pub id: u16,
    pub league_name: String,
    pub lower_bound: i16,
    pub league_cost: i16,
}

#[tauri::command]
pub async fn get_league(state: tauri::State<'_, AppState>) -> Result<Vec<League>, ()> {
    let db: &Pool<Sqlite> = &state.db;

    let users: Vec<User> = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?1")
        .bind(1)
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("could not get users: {}", e))
        .unwrap();

    let leagues: Vec<League> = sqlx::query_as::<_, League>("SELECT * FROM leagues WHERE id = ?1")
        .bind(users[0].league_id)
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("could not get league: {}", e))
        .unwrap();

    Ok(leagues)
}

#[tauri::command]
pub async fn update_league(state: tauri::State<'_, AppState>, points: i16)-> Result<Vec<League>, ()> {
    let db: &Pool<Sqlite> = &state.db;

    let new_leagues: Vec<League> = sqlx::query_as::<_, League>("SELECT * FROM leagues WHERE lower_bound <= ?1")
        .bind(points)
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("could not get league: {}", e))
        .unwrap();

    let _ = sqlx::query("UPDATE users SET league_id = ?1 WHERE id = 1")
        .bind(new_leagues[new_leagues.len() - 1].id)
        .execute(db)
        .await
        .map_err(|e| format!("could not update league: {}", e));

    Ok(new_leagues)
}