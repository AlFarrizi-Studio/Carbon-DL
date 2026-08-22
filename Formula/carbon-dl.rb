class CarbonDl < Formula
  desc "Grab any video or music from anywhere. Pick format, FPS, quality. Download. Done."
  homepage "https://github.com/AlFarrizi-Studio/Carbon-DL"
  # Uses GitHub auto-generated source archive from tag (no release assets needed)
  url "https://github.com/AlFarrizi-Studio/Carbon-DL/archive/refs/tags/v1.0.8-beta.tar.gz"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"
  license "Apache-2.0"

  depends_on "node"

  def install
    libexec.install "dist/cli.js"
    (bin/"carbon-dl").write <<~EOS
      #!/usr/bin/env bash
      exec node "#{libexec}/cli.js" "$@"
    EOS
  end

  test do
    assert_match "carbon", shell_output("#{bin}/carbon-dl --version")
  end
end