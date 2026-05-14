using Godot;
using FlappyBird.Core;
using System.IO;

namespace FlappyBird;

public partial class Main : Control
{
    public override void _Ready()
    {
        var screenshotPath = CliArgs.GetScreenshotPath(OS.GetCmdlineUserArgs());
        if (screenshotPath is not null)
        {
            CaptureAfterFrames(screenshotPath);
        }
    }

    private async void CaptureAfterFrames(string outputPath)
    {
        await ToSignal(GetTree(), SceneTree.SignalName.ProcessFrame);
        await ToSignal(GetTree(), SceneTree.SignalName.ProcessFrame);

        var dir = Path.GetDirectoryName(outputPath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }

        var image = GetViewport().GetTexture().GetImage();
        var err = image.SavePng(outputPath);
        GD.Print($"[screenshot] saved to {outputPath} (err={err})");
        GetTree().Quit();
    }
}
