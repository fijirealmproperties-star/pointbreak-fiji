const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

class SQLiteWrapper {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.ready = this._init();
    const flush = () => this._save();
    process.on('exit', flush);
    process.on('SIGINT', () => { flush(); process.exit(0); });
    process.on('SIGTERM', () => { flush(); process.exit(0); });
  }

  async _init() {
    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }
    this._save();
  }

  _save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  _saveDebounced() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._save(), 100);
  }

  exec(sql) {
    this.db.exec(sql);
    this._saveDebounced();
  }

  prepare(sql) {
    const db = this.db;
    const wrapper = this;
    return {
      run(...params) {
        try {
          db.run(sql, params);
          wrapper._save();
        } catch (e) {
          // Handle INSERT OR IGNORE
          if (!sql.includes('INSERT OR IGNORE') && !sql.includes('OR IGNORE')) {
            console.error('SQL run error:', e.message, sql.substring(0, 80));
          }
        }
        return { changes: db.getRowsModified() };
      },
      get(...params) {
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const values = stmt.get();
            stmt.free();
            const row = {};
            cols.forEach((col, i) => { row[col] = values[i]; });
            return row;
          }
          stmt.free();
          return undefined;
        } catch (e) {
          console.error('SQL get error:', e.message);
          return undefined;
        }
      },
      all(...params) {
        const rows = [];
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          while (stmt.step()) {
            const cols = stmt.getColumnNames();
            const values = stmt.get();
            const row = {};
            cols.forEach((col, i) => { row[col] = values[i]; });
            rows.push(row);
          }
          stmt.free();
        } catch (e) {
          console.error('SQL all error:', e.message);
        }
        return rows;
      },
    };
  }

  pragma(str) {
    try { this.db.run(`PRAGMA ${str}`); } catch {}
  }

  close() {
    this._save();
    this.db.close();
  }
}

module.exports = SQLiteWrapper;
