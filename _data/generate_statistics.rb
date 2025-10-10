#!/usr/bin/env ruby
# frozen_string_literal: true

require 'yaml'
require 'date'
require 'fileutils'

# Statistics Generator for Jekyll Site
# Analyzes site content and generates comprehensive statistics

class SiteStatisticsGenerator
  def initialize(site_root = '.')
    @site_root = File.expand_path(site_root)
    @posts_dir = File.join(@site_root, '_posts')
    @pages_dir = File.join(@site_root, 'pages')
    @collections_dirs = [
      File.join(@site_root, '_quests'),
      File.join(@site_root, '_docs'),
      File.join(@site_root, '_projects')
    ]
    @output_file = File.join(@site_root, '_data', 'content_statistics.yml')
    
    @stats = {
      'generated_at' => Time.now.strftime('%Y-%m-%d %H:%M:%S'),
      'overview' => {},
      'categories' => {},
      'tags' => {},
      'content_breakdown' => {},
      'monthly_distribution' => {},
      'word_statistics' => {}
    }
  end

  def generate!
    puts "🔍 Analyzing site content..."
    
    analyze_posts
    analyze_pages
    analyze_collections
    calculate_overview_metrics
    sort_and_finalize_data
    write_statistics_file
    
    puts "✅ Statistics generated successfully!"
    puts "📊 Results saved to: #{@output_file}"
    print_summary
  end

  private

  def analyze_posts
    posts_pattern = File.join(@posts_dir, '**', '*.{md,markdown,html}')
    posts_pattern2 = File.join(@pages_dir, '_posts', '**', '*.{md,markdown,html}')
    
    post_files = Dir[posts_pattern] + Dir[posts_pattern2]
    
    puts "📝 Found #{post_files.length} post files"
    
    post_files.each do |file|
      process_content_file(file, 'post')
    end
  end

  def analyze_pages
    # Look for standalone pages (not in _posts)
    pages_pattern = File.join(@pages_dir, '**', '*.{md,markdown,html}')
    page_files = Dir[pages_pattern].reject { |f| f.include?('_posts') }
    
    # Also check root level pages
    root_pages = Dir[File.join(@site_root, '*.{md,markdown,html}')]
    page_files += root_pages
    
    puts "📄 Found #{page_files.length} page files"
    
    page_files.each do |file|
      process_content_file(file, 'page')
    end
  end

  def analyze_collections
    @collections_dirs.each do |dir|
      next unless Dir.exist?(dir)
      
      collection_name = File.basename(dir).gsub(/^_/, '')
      collection_files = Dir[File.join(dir, '**', '*.{md,markdown,html}')]
      
      puts "📚 Found #{collection_files.length} #{collection_name} files"
      
      collection_files.each do |file|
        process_content_file(file, collection_name)
      end
    end
  end

  def process_content_file(file_path, content_type)
    return unless File.file?(file_path)
    
    content = File.read(file_path)
    
    # Extract front matter
    if content =~ /\A---\s*\n(.*?)\n---\s*\n(.*)\z/m
      front_matter_str = $1
      body_content = $2
      
      begin
        front_matter = YAML.safe_load(front_matter_str, permitted_classes: [Date, Time]) || {}
      rescue YAML::SyntaxError => e
        puts "⚠️  YAML error in #{file_path}: #{e.message}"
        return
      rescue Psych::DisallowedClass => e
        # Try again with basic safe_load
        begin
          front_matter = YAML.safe_load(front_matter_str) || {}
        rescue => e2
          puts "⚠️  YAML parsing error in #{file_path}: #{e2.message}"
          return
        end
      end
    else
      # No front matter found
      front_matter = {}
      body_content = content
    end

    # Skip drafts
    return if front_matter['draft'] == true
    
    # Count this content
    @stats['content_breakdown'][content_type] ||= 0
    @stats['content_breakdown'][content_type] += 1

    # Process categories
    categories = front_matter['categories'] || front_matter['category']
    if categories
      categories = [categories] unless categories.is_a?(Array)
      categories.each do |category|
        next if category.nil? || category.to_s.strip.empty?
        category_str = category.to_s.strip
        @stats['categories'][category_str] ||= 0
        @stats['categories'][category_str] += 1
      end
    end

    # Process tags
    tags = front_matter['tags'] || front_matter['tag']
    if tags
      tags = [tags] unless tags.is_a?(Array)
      tags.each do |tag|
        next if tag.nil? || tag.to_s.strip.empty?
        tag_str = tag.to_s.strip.downcase
        @stats['tags'][tag_str] ||= 0
        @stats['tags'][tag_str] += 1
      end
    end

    # Process dates for monthly distribution
    if front_matter['date']
      begin
        # Handle different date formats
        date_value = front_matter['date']
        if date_value.is_a?(String)
          date = Date.parse(date_value)
        elsif date_value.respond_to?(:to_date)
          date = date_value.to_date
        else
          date = Date.parse(date_value.to_s)
        end
        
        month_key = date.strftime('%Y-%m')
        @stats['monthly_distribution'][month_key] ||= 0
        @stats['monthly_distribution'][month_key] += 1
      rescue => e
        puts "⚠️  Date parsing error in #{file_path}: #{e.message} (date: #{front_matter['date']})"
        # Skip this date
      end
    end

    # Count words in content
    word_count = count_words(body_content)
    @stats['word_statistics'][File.basename(file_path)] = {
      'words' => word_count,
      'type' => content_type,
      'title' => front_matter['title'] || File.basename(file_path, '.*')
    }
  end

  def count_words(content)
    # Remove markdown syntax and count words
    text = content.gsub(/[#*_`\[\](){}]/, ' ')  # Remove markdown syntax
                  .gsub(/!\[.*?\]\(.*?\)/, ' ')    # Remove images
                  .gsub(/\[.*?\]\(.*?\)/, ' ')     # Remove links
                  .gsub(/```.*?```/m, ' ')         # Remove code blocks
                  .gsub(/`.*?`/, ' ')              # Remove inline code
                  .gsub(/<!--.*?-->/m, ' ')        # Remove comments
                  .gsub(/\s+/, ' ')                # Normalize whitespace
                  .strip

    text.split.length
  end

  def calculate_overview_metrics
    total_content = @stats['content_breakdown'].values.sum
    total_words = @stats['word_statistics'].values.sum { |stat| stat['words'] }
    
    @stats['overview'] = {
      'total_posts' => @stats['content_breakdown']['post'] || 0,
      'total_pages' => @stats['content_breakdown']['page'] || 0,
      'total_content' => total_content,
      'total_categories' => @stats['categories'].keys.length,
      'total_tags' => @stats['tags'].keys.length,
      'total_words' => total_words,
      'average_words_per_post' => total_content > 0 ? (total_words.to_f / total_content).round(1) : 0
    }
  end

  def sort_and_finalize_data
    # Sort categories and tags by count (descending)
    @stats['categories'] = @stats['categories'].sort_by { |_, count| -count }.to_h
    @stats['tags'] = @stats['tags'].sort_by { |_, count| -count }.to_h
    
    # Sort monthly distribution by date
    @stats['monthly_distribution'] = @stats['monthly_distribution'].sort.to_h
    
    # Convert to arrays for Jekyll (categories and tags)
    @stats['categories'] = @stats['categories'].map { |name, count| [name, count] }
    @stats['tags'] = @stats['tags'].map { |name, count| [name, count] }
  end

  def write_statistics_file
    # Ensure _data directory exists
    FileUtils.mkdir_p(File.dirname(@output_file))
    
    # Write YAML file
    File.open(@output_file, 'w') do |file|
      file.write(@stats.to_yaml)
    end
  end

  def print_summary
    puts "\n📊 STATISTICS SUMMARY"
    puts "=" * 50
    puts "📝 Total Posts: #{@stats['overview']['total_posts']}"
    puts "📄 Total Pages: #{@stats['overview']['total_pages']}"
    puts "📚 Total Content: #{@stats['overview']['total_content']}"
    puts "📂 Categories: #{@stats['overview']['total_categories']}"
    puts "🏷️  Tags: #{@stats['overview']['total_tags']}"
    puts "📝 Total Words: #{@stats['overview']['total_words'].to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}"
    puts "📊 Average Words/Post: #{@stats['overview']['average_words_per_post']}"
    
    if @stats['categories'].any?
      puts "\n🏆 TOP CATEGORIES:"
      @stats['categories'].first(5).each_with_index do |(name, count), index|
        puts "  #{index + 1}. #{name}: #{count} posts"
      end
    end
    
    if @stats['tags'].any?
      puts "\n🏷️  TOP TAGS:"
      @stats['tags'].first(10).each_with_index do |(name, count), index|
        puts "  #{index + 1}. #{name}: #{count} uses"
      end
    end
    
    puts "\n✅ Statistics generation complete!"
  end
end

# Run the generator if this script is executed directly
if __FILE__ == $0
  puts "🚀 Starting Jekyll Site Statistics Generation..."
  puts "📁 Working directory: #{Dir.pwd}"
  
  generator = SiteStatisticsGenerator.new
  generator.generate!
end