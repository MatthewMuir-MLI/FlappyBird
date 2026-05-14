using FlappyBird.Core;
using Xunit;

namespace FlappyBird.Tests;

public class GameInfoTests
{
    [Fact]
    public void TitleIsFlappyBird()
    {
        Assert.Equal("FlappyBird", GameInfo.Title);
    }

    [Fact]
    public void VersionIsSemver()
    {
        Assert.Matches(@"^\d+\.\d+\.\d+$", GameInfo.Version);
    }
}
