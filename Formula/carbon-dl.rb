class CarbonDl < Formula
  desc "Grab any video or music from anywhere. Pick format, FPS, quality. Download. Done."
  homepage "https://github.com/AlFarrizi-Studio/Carbon-DL"
  # Update url + sha256 after each GitHub release:
  #   curl -sL <url> | shasum -a 256
  url "https://github.com/AlFarrizi-Studio/Carbon-DL/releases/download/v1.0.7/carbon-dl-macos.tar.gz"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"
  license "MIT"

  depends_on "node"

  def install
    libexec.install Dir["*"]
    (bin/"carbon-dl").write <<~EOS
      #!/usr/bin/env bash
      exec node "#{libexec}/cli.js" "$@"
    EOS
  end

  test do
    assert_match "carbon", shell_output("#{bin}/carbon-dl --version")
  end
end