#!/usr/bin/env ruby
# frozen_string_literal: true

# Fixture stand-in for the theme's parity script: green unless a DRIFT file
# sits in the theme root, in which case it reports what the file lists.
drift = File.join(Dir.pwd, "DRIFT")
if File.file?(drift)
  warn "design-system-check: problem(s) — theme and mirror have drifted:"
  File.readlines(drift, chomp: true).each { |line| warn "  - #{line}" }
  exit 1
end
puts "design-system-check: OK — 8 token file pairs, 2 skins, no dangling tokens"
