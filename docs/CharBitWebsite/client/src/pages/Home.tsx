import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CharacterCard } from "@/components/CharacterCard";
import { ArtistCard } from "@/components/ArtistCard";
import { useAuth } from "@/hooks/useAuth";
import { Search, Clock, Users, Star, Hash } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch data
  const { data: recentlyViewed, isLoading: recentlyViewedLoading } = useQuery({
    queryKey: ["/api/characters/recently-viewed"],
  });

  const { data: followingFeed, isLoading: followingFeedLoading } = useQuery({
    queryKey: ["/api/characters/following/feed"],
  });

  const { data: featuredCharacters, isLoading: featuredCharactersLoading } = useQuery({
    queryKey: ["/api/characters", { type: "featured" }],
  });

  const { data: featuredCreators, isLoading: featuredCreatorsLoading } = useQuery({
    queryKey: ["/api/creators/featured"],
  });

  const { data: trendingTags, isLoading: trendingTagsLoading } = useQuery({
    queryKey: ["/api/tags/trending"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/explore?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold">Discover Amazing Characters</h1>
              <p className="text-muted-foreground mt-1">
                Explore original characters from talented creators
              </p>
            </div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-md w-full">
              <Input
                type="text"
                placeholder="Search characters, creators, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Recently Viewed Characters */}
        {recentlyViewed && recentlyViewed.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Clock className="mr-3 text-primary" />
              Recently Viewed Characters
            </h2>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {recentlyViewed.map((character: any) => (
                <Link
                  key={character.id}
                  href={`/character/${character.id}`}
                  className="flex-shrink-0"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all">
                    {character.avatarUrl ? (
                      <img
                        src={character.avatarUrl}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-muted-foreground">
                          {character.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Characters From Artists You Follow */}
        {followingFeed && followingFeed.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Users className="mr-3 text-primary" />
              Characters From Artists You Follow
            </h2>
            {followingFeedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {followingFeed.map((character: any) => (
                  <CharacterCard key={character.id} character={character} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Featured Characters */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <Star className="mr-3 text-yellow-500" />
              Featured Characters
            </h2>
            <Link href="/explore?type=featured">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          {featuredCharactersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredCharacters?.map((character: any) => (
                <CharacterCard key={character.id} character={character} />
              ))}
            </div>
          )}
        </section>

        {/* Featured Artists */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <Users className="mr-3 text-primary" />
              Featured Artists
            </h2>
            <Link href="/creators">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          {featuredCreatorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCreators?.map((creator: any) => (
                <ArtistCard key={creator.id} artist={creator} />
              ))}
            </div>
          )}
        </section>

        {/* Trending Tags */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Hash className="mr-3 text-primary" />
            Trending Tags
          </h2>
          {trendingTagsLoading ? (
            <div className="flex flex-wrap gap-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {trendingTags?.map((tag: any) => (
                <Link key={tag.tag} href={`/tags/${encodeURIComponent(tag.tag)}`}>
                  <Badge
                    variant={tag.tag === "OC" ? "default" : "secondary"}
                    className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer px-4 py-2 text-sm font-semibold"
                  >
                    #{tag.tag} ({tag.count})
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
