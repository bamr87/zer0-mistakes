# frozen_string_literal: true

RSpec.describe "Feature dependency graph" do
  let(:features) { load_features }
  let(:valid_ids) { features.map { |f| f["id"] } }

  it "all ZER0-XXX dependency references point to existing features" do
    features.each do |feature|
      deps = feature["dependencies"] || []
      # Only check dependencies that are ZER0-XXX feature IDs (strings)
      zer0_deps = deps.select { |d| d.is_a?(String) && d.match?(/\AZER0-\d{3}\z/) }
      zer0_deps.each do |dep_id|
        expect(valid_ids).to include(dep_id),
          "#{feature['id']} depends on #{dep_id} which does not exist"
      end
    end
  end

  it "has no circular dependencies" do
    # Build adjacency list
    graph = {}
    features.each do |feature|
      graph[feature["id"]] = feature["dependencies"] || []
    end

    # DFS cycle detection
    visited = {}
    in_stack = {}
    cycles = []

    detect_cycle = lambda do |node, path|
      visited[node] = true
      in_stack[node] = true
      path.push(node)

      (graph[node] || []).each do |dep|
        if in_stack[dep]
          cycle_start = path.index(dep)
          cycles << path[cycle_start..].join(" -> ") + " -> #{dep}"
        elsif !visited[dep]
          detect_cycle.call(dep, path)
        end
      end

      path.pop
      in_stack[node] = false
    end

    graph.keys.each do |node|
      detect_cycle.call(node, []) unless visited[node]
    end

    expect(cycles).to be_empty,
      "Circular dependencies detected:\n  #{cycles.join("\n  ")}"
  end
end
