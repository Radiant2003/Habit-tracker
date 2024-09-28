// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{cmp::max_by, fs::OpenOptions, time::{SystemTime, UNIX_EPOCH}};
use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::{prelude::FromRow, sqlite::SqlitePoolOptions, Pool, Sqlite};
use tauri::{App, Manager};
use futures::TryStreamExt;

type Db = Pool<Sqlite>;

struct AppState {
  db: Db
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
struct User {
  id: u16,
  points: i16,
  updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
struct Habit {
  id: u16,
  habit_name: String,
  points: i16,
}

async fn setup_db(app: &App) -> Db {
  let mut path = app.path_resolver()
    .app_data_dir().expect("could not get data dir");
  
  match std::fs::create_dir_all(path.clone()) {
    Ok(_) => {}
    Err(err) => {
      panic!("error creating directory {}", err);
    }
  };

  path.push("db.sqlite");

  let result = OpenOptions::new().create_new(true).write(true).open(&path);

  match result {
    Ok(_) => println!("database file created"),
    Err(err) => match err.kind() {
      std::io::ErrorKind::AlreadyExists => println!("database file already exists"),
      _ => {
        panic!("error creating database file {}", err);
      }
    },
  }

  let db = SqlitePoolOptions::new().connect(path.to_str().unwrap()).await.unwrap();

  sqlx::migrate!("./migrations").run(&db).await.unwrap();

  db
  }

#[tauri::command]
async fn create_or_get_user(state: tauri::State<'_, AppState>) -> Result<Vec<User>, String> {
  let db: &Pool<Sqlite> = &state.db;

  let existing_users: Vec<User> = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?1")
    .bind(1)
    .fetch(db)
    .try_collect()
    .await
    .map_err(|e| format!("could not get users: {}", e)).unwrap();

  if existing_users.len() == 0 {
    sqlx::query("INSERT INTO users (points, updated_at) VALUES (?1, ?2)")
      .bind(0)
      .bind(SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64)
      .execute(db)
      .await
      .map_err(|e| format!("could not create user: {}", e)).unwrap();

      let new_users: Vec<User> = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?1")
      .bind(1)
      .fetch(db)
      .try_collect()
      .await
      .map_err(|e| format!("could not get users: {}", e)).unwrap();

    return Ok(new_users);
  }

  Ok(existing_users)
}

#[tauri::command]
async fn create_habit(state: tauri::State<'_, AppState>, habit: &str) -> Result<Vec<Habit>, ()> {
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
    .map_err(|e| format!("Failed to get habits: {}", e)).unwrap();

  Ok(habits)
}

#[tauri::command]
async fn get_habits(state: tauri::State<'_, AppState>) -> Result<Vec<Habit>, ()> {
  let db: &Pool<Sqlite> = &state.db;

  let habits: Vec<Habit> = sqlx::query_as::<_, Habit>("SELECT * FROM habits")
    .fetch(db)
    .try_collect()
    .await
    .map_err(|e| format!("Failed to get habits: {}", e)).unwrap();

  Ok(habits)
}

#[tauri::command]
async fn update_habit(state: tauri::State<'_, AppState>, habit: &str) -> Result<Vec<Habit>, ()> {
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
    .map_err(|e| format!("Failed to get habits: {}", e)).unwrap();

  Ok(edited_habit)
}

#[tauri::command]
async fn delete_habit(state: tauri::State<'_, AppState>, id: u16) -> Result<Vec<Habit>, ()> {
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
    .map_err(|e| format!("Failed to get habits: {}", e)).unwrap();

  Ok(habits)
}

#[tauri::command]
async fn update_user_points(state: tauri::State<'_, AppState>, points: i16) -> Result<i16, String> {
  let db: &Pool<Sqlite> = &state.db;

  let users: Vec<User> = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?1")
      .bind(1)
      .fetch(db)
      .try_collect()
      .await
      .map_err(|e| format!("could not get users: {}", e)).unwrap();

  let new_points: i16 = max_by(users[0].points + points, 0, |x: &i16, y: &i16| x.cmp(&y));

  let _ = sqlx::query("UPDATE users SET points = ?1 WHERE id = ?2")
    .bind(new_points)
    .bind(users[0].id)
    .execute(db)
    .await
    .map_err(|e| format!("could not update points: {}", e));

  Ok(new_points)
}

#[tauri::command]
async fn check_user_update(state: tauri::State<'_, AppState>, league_entry_points: i16) -> Result<i16, ()> {
  let db: &Pool<Sqlite> = &state.db;

  let users: Vec<User> = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?1")
      .bind(1)
      .fetch(db)
      .try_collect()
      .await
      .map_err(|e| format!("could not get users: {}", e)).unwrap();

  let now: i64 = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64;

  if (users[0].updated_at + 8640000) < now {
    let days_inactive: i16 = ((now - users[0].updated_at) / 8640000) as i16;
    
    let new_points: i16 = max_by(users[0].points - days_inactive * league_entry_points, 0, |x: &i16, y: &i16| x.cmp(&y));

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

#[tokio::main]
async fn main() -> Result<(), ()> {

  let app: App = tauri::Builder::default()
  .invoke_handler(tauri::generate_handler![
    create_or_get_user,
    create_habit,
    get_habits,
    update_habit,
    delete_habit,
    update_user_points,
    check_user_update,
  ])
  .build(tauri::generate_context!())
  .expect("error while running tauri application");

  let db: Pool<Sqlite> = setup_db(&app).await;

  app.manage(AppState{ db });
  app.run(|_, _| {});

  Ok(())
}
