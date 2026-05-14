using FlappyBird.Core;
using Xunit;

namespace FlappyBird.Tests;

public class CliArgsTests
{
    [Fact]
    public void ReturnsPathWhenFlagIsPresent()
    {
        var args = new[] { "--capture-screenshot", "out/foo.png" };
        Assert.Equal("out/foo.png", CliArgs.GetScreenshotPath(args));
    }

    [Fact]
    public void ReturnsNullWhenFlagIsAbsent()
    {
        var args = new[] { "--other", "value" };
        Assert.Null(CliArgs.GetScreenshotPath(args));
    }

    [Fact]
    public void ReturnsNullForEmptyArgs()
    {
        Assert.Null(CliArgs.GetScreenshotPath(System.Array.Empty<string>()));
    }

    [Fact]
    public void ReturnsNullWhenFlagIsLastArgWithNoValue()
    {
        var args = new[] { "--capture-screenshot" };
        Assert.Null(CliArgs.GetScreenshotPath(args));
    }

    [Fact]
    public void FindsFlagAmongOtherArgs()
    {
        var args = new[] { "--verbose", "--capture-screenshot", "a/b.png", "--trailing" };
        Assert.Equal("a/b.png", CliArgs.GetScreenshotPath(args));
    }
}
