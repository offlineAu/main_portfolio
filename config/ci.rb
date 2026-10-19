CI.run do
  step "Setup", "bin/setup --skip-server"
  step "Security: Gem audit", "bin/bundler-audit"
  step "Security: Importmap audit", "bin/importmap audit"
  step "Security: Brakeman", "bin/brakeman --no-pager"
  step "Autoloading", "bin/rails zeitwerk:check"
  step "Tests", "bin/rails test"
end
