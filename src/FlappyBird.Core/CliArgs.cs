namespace FlappyBird.Core;

public static class CliArgs
{
    public const string CaptureScreenshotFlag = "--capture-screenshot";

    public static string? GetScreenshotPath(string[] args)
    {
        for (int i = 0; i < args.Length - 1; i++)
        {
            if (args[i] == CaptureScreenshotFlag)
            {
                return args[i + 1];
            }
        }
        return null;
    }
}
