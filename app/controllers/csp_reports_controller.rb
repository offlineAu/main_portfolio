# Browsers POST here when the content security policy blocks something: an injection attempt,
# or a policy that is breaking the page. Reports are logged, never stored or echoed.
class CspReportsController < ActionController::API
  MAX_BYTES = 8.kilobytes

  rate_limit to: 30, within: 1.minute, store: Rails.cache, with: -> { head :too_many_requests }

  def create
    body = request.body.read(MAX_BYTES + 1).to_s
    return head 413 if body.bytesize > MAX_BYTES

    report = JSON.parse(body)
    report = report["csp-report"] if report.is_a?(Hash) && report.key?("csp-report")
    if report.is_a?(Hash)
      fields = report.slice("document-uri", "violated-directive", "effective-directive", "blocked-uri", "source-file", "line-number")
      Rails.logger.warn("[CSP violation] #{fields.transform_values { |value| value.to_s.first(300) }.to_json}")
    end
    head :no_content
  rescue JSON::ParserError
    head :bad_request
  end
end
