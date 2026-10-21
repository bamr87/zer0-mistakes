# frozen_string_literal: true

# Builds the docs site into a preview directory (PreviewBuilder).
class PreviewBuildJob < ScriptJob
  private

  def execute(job, sink, interrupt)
    id, stats = PreviewBuilder.build(theme: ThemeRoot.path, sink: sink, interrupt: interrupt)
    job.update!(artifact_dir: PreviewBuilder.dir.join(id).to_s)
    stats.merge("build_id" => id)
  end
end
