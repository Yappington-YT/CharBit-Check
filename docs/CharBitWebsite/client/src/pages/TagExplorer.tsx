import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CharacterCard } from "@/components/CharacterCard";
import { Hash, Search, TrendingUp } from "lucide-react";

export default function TagExplorer() {
  const params = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const selectedTag = params.tag || "";

  const { data: trendingTags, isLoading: tagsLoading } = useQuery({
    queryKey: ['/api/tags/trending'],
    enabled: !selectedTag,
  });

  const { data: characters, isLoading: charactersLoading } = useQuery({
    queryKey: ['/api/characters', { tags: selectedTag, query: searchTerm }],
    enabled: !!selectedTag || !!searchTerm,
  });

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    // Search functionality will be handled by the query
  };

  if (!selectedTag && !searchTerm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Hash className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">Tag Explorer</h1>
            <p className="text-muted-foreground">
              Discover characters by tags and explore trending content
            </p>
          </div>

          <div className="flex gap-2 mb-8">
            <Input
              placeholder="Search by tag or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tagsLoading ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-20 rounded-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {trendingTags?.map((tag: any) => (
                    <Badge
                      key={tag.tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setSearchTerm(tag.tag)}
                    >
                      #{tag.tag} ({tag.count})
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by tag or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          {selectedTag && (
            <h1 className="text-2xl font-bold">
              Characters tagged with #{selectedTag}
            </h1>
          )}
          
          {searchTerm && !selectedTag && (
            <h1 className="text-2xl font-bold">
              Search results for "{searchTerm}"
            </h1>
          )}
        </div>

        {charactersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : characters?.length === 0 ? (
          <div className="text-center py-12">
            <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No characters found</h3>
            <p className="text-muted-foreground">
              Try searching for different tags or keywords
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters?.map((character: any) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}