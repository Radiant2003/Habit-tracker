use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::fs::OpenOptions;
use tauri::{Manager, App};

pub type Db = Pool<Sqlite>;

pub async fn setup_db(app: &App) -> Db {
    let mut path = app
        .path()
        .app_data_dir()
        .expect("could not get data dir");

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

    let db = SqlitePoolOptions::new()
        .connect(path.to_str().unwrap())
        .await
        .unwrap();

    sqlx::migrate!("./migrations")
        .set_ignore_missing(true)
        .run(&db)
        .await
        .unwrap();

    db
}
