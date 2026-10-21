#!/usr/bin/env ruby
# frozen_string_literal: true

# Fixture stand-in for scripts/propagate.rb (report mode).
puts "propagate: #{ARGV.empty? ? 'report' : ARGV.join(' ')}"
