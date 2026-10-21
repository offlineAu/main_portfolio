module Admin
  class ContentController < BaseController
    RESOURCES = { "projects" => Project, "skills" => Skill, "experiences" => Experience, "profile" => Profile }.freeze
    before_action :set_resource
    before_action :set_record, only: [:edit, :update, :destroy, :preview]

    def index
      return redirect_to admin_edit_content_path(resource: "profile", id: @profile.id) if @model == Profile
      @records = @model.ordered
    end

    def new
      raise ActiveRecord::RecordNotFound if @model == Profile
      @record = @model.new(position: @model.maximum(:position).to_i + 1)
    end

    def create
      raise ActiveRecord::RecordNotFound if @model == Profile
      @record = @model.new(record_params)
      if @record.save
        audit("content.created", subject: @record)
        redirect_to admin_contents_path(resource: @resource), notice: "Content created."
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit
    end

    def update
      attributes = record_params
      uploads = attributes.delete(:gallery)
      @record.assign_attributes(attributes)
      @record.gallery.attach(uploads) if @model == Project && uploads.present?
      if @record.save
        removed = remove_requested_images
        audit("content.updated", subject: @record, details: { fields: @record.saved_changes.keys - %w[updated_at], images_added: uploads.present? ? Array(uploads).size : 0, images_removed: removed.to_i }.compact_blank)
        redirect_to admin_edit_content_path(resource: @resource, id: @record.to_param), notice: "Changes saved."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      raise ActiveRecord::RecordNotFound if @model == Profile
      @record.destroy!
      audit("content.deleted", subject: @record)
      redirect_to admin_contents_path(resource: @resource), notice: "Content deleted.", status: :see_other
    end

    def preview
      raise ActiveRecord::RecordNotFound unless @model == Project
      @project = @record
      @preview = true
      render "projects/show", layout: "application"
    end

    private

    def set_resource
      @resource = params[:resource]
      @model = RESOURCES.fetch(@resource) { raise ActiveRecord::RecordNotFound }
    end

    def set_record
      @record = @model == Project ? @model.find_by!(slug: params[:id]) : @model.find(params[:id])
    end

    def record_params
      fields = case @resource
      when "projects"
        [:name, :slug, :tagline, :description, :role, :year, :category, :status, :problem, :contribution, :implementation, :technologies_text, :highlights_text, :source_url, :live_url, :featured, :published, :watermark, :position, :cover, :cover_alt, :gallery_alt, :editorial_notes, { gallery: [], gallery_details: {} }]
      when "skills"
        [:name, :category, :note, :position]
      when "experiences"
        [:role, :organization, :period, :current, :details, :position]
      when "profile"
        [:name, :short_name, :handle, :title, :location, :email, :phone, :website_url, :education, :github_url, :linkedin_url, :availability, :introduction, :about, :focus, :credentials, :portrait, :portrait_alt, :watermark_portrait]
      end
      params.require(:content).permit(*fields).tap do |allowed|
        if allowed[:gallery_details]
          permitted_ids = @record&.persisted? ? @record.gallery.attachments.pluck(:id).map(&:to_s) : []
          allowed[:gallery_details] = allowed[:gallery_details].to_h.slice(*permitted_ids).transform_values do |details|
            { "alt" => details["alt"].to_s, "position" => [details["position"].to_i, 0].max }
          end
        end
        [:cover, :portrait, :gallery].each { |key| allowed.delete(key) if allowed[key].blank? || allowed[key] == [""] }
      end
    end

    def remove_requested_images
      return unless @record.respond_to?(:cover) || @record.respond_to?(:portrait)
      attachments = @model == Profile ? [@record.portrait.attachment].compact : [@record.cover.attachment].compact + @record.gallery.attachments
      removed = Array(params[:remove_images]).filter_map { |id| attachments.find { |attachment| attachment.id.to_s == id.to_s } }
      removed.each(&:purge)
      removed.size
    end
  end
end
