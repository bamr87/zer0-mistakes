# frozen_string_literal: true

class CreateJobs < ActiveRecord::Migration[8.1]
  def change
    create_table :jobs do |t|
      t.string :kind, null: false
      t.string :status, null: false, default: "pending"
      t.references :site, foreign_key: true
      t.json :params, null: false, default: {}
      t.text :log
      t.json :stats, null: false, default: {}
      t.text :error
      t.string :artifact_dir
      t.datetime :started_at
      t.datetime :finished_at
      t.timestamps
    end
    add_index :jobs, [ :kind, :created_at ]
    add_index :jobs, :status
  end
end
