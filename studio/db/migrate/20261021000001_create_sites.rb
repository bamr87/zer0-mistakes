# frozen_string_literal: true

class CreateSites < ActiveRecord::Migration[8.1]
  def change
    create_table :sites do |t|
      t.string :name, null: false
      t.string :path, null: false
      t.string :repo
      t.string :mode, null: false, default: "unknown"
      t.string :source_subdir
      t.string :registered_from, null: false, default: "form"
      t.datetime :last_audit_at
      t.json :last_audit_summary, null: false, default: {}
      t.text :notes
      t.timestamps
    end
    add_index :sites, :path, unique: true
    add_index :sites, :name
  end
end
