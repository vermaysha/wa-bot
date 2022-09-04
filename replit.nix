{ pkgs }: {
	deps = [
		pkgs.ffmpeg.bin
  pkgs.imagemagick7
  pkgs.nodejs-16_x
        pkgs.nodePackages.typescript-language-server
        pkgs.yarn
        pkgs.replitPackages.jest
	];
}
