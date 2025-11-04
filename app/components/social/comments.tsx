"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Flag, MoreHorizontal, Send } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock comments data
const mockComments = [
  {
    id: "comment1",
    user: {
      id: "user1",
      name: "Alex Johnson",
      username: "beatmaker99",
      avatarUrl: "/vibrant-city-market.png",
    },
    content: "These drums are absolutely fire! The 808s hit so hard in the mix.",
    timestamp: "2023-10-15T14:32:00Z",
    likes: 24,
    replies: [
      {
        id: "reply1",
        user: {
          id: "user2",
          name: "Sarah Williams",
          username: "drumgod",
          avatarUrl: "/placeholder.svg?height=40&width=40&query=user2",
        },
        content: "I agree! I've been using these in all my recent productions.",
        timestamp: "2023-10-15T15:10:00Z",
        likes: 8,
      },
    ],
  },
  {
    id: "comment2",
    user: {
      id: "user3",
      name: "Mike Chen",
      username: "rhythmmaster",
      avatarUrl: "/placeholder.svg?height=40&width=40&query=user3",
    },
    content: "The snares in this kit are perfect for that trap bounce. Great processing on these samples!",
    timestamp: "2023-10-14T09:45:00Z",
    likes: 17,
    replies: [],
  },
  {
    id: "comment3",
    user: {
      id: "user4",
      name: "Taylor Rodriguez",
      username: "beatsmith",
      avatarUrl: "/placeholder.svg?height=40&width=40&query=user4",
    },
    content: "How did you process these hi-hats? They sound so crisp!",
    timestamp: "2023-10-13T22:17:00Z",
    likes: 12,
    replies: [
      {
        id: "reply2",
        user: {
          id: "user1",
          name: "Alex Johnson",
          username: "beatmaker99",
          avatarUrl: "/vibrant-city-market.png",
        },
        content: "I used some subtle saturation and a high shelf EQ boost around 10kHz. Glad you like them!",
        timestamp: "2023-10-14T08:22:00Z",
        likes: 9,
      },
    ],
  },
]

export function Comments() {
  const [comments, setComments] = useState(mockComments)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({})
  const [likedReplies, setLikedReplies] = useState<Record<string, boolean>>({})

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment = {
      id: `comment${Date.now()}`,
      user: {
        id: "currentUser",
        name: "Current User",
        username: "you",
        avatarUrl: "/placeholder.svg?height=40&width=40&query=currentUser",
      },
      content: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: [],
    }

    setComments([comment, ...comments])
    setNewComment("")
  }

  const handleAddReply = (commentId: string) => {
    if (!replyContent.trim()) return

    const reply = {
      id: `reply${Date.now()}`,
      user: {
        id: "currentUser",
        name: "Current User",
        username: "you",
        avatarUrl: "/placeholder.svg?height=40&width=40&query=currentUser",
      },
      content: replyContent,
      timestamp: new Date().toISOString(),
      likes: 0,
    }

    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...comment.replies, reply],
        }
      }
      return comment
    })

    setComments(updatedComments)
    setReplyingTo(null)
    setReplyContent("")
  }

  const toggleLikeComment = (commentId: string) => {
    setLikedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  const toggleLikeReply = (replyId: string) => {
    setLikedReplies((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Comments</h2>

      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src="/placeholder.svg?height=40&width=40&query=currentUser" alt="Your avatar" />
          <AvatarFallback>YO</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Comment
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.user.avatarUrl || "/placeholder.svg"} alt={comment.user.name} />
                <AvatarFallback>{comment.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{comment.user.name}</span>
                    <span className="text-muted-foreground ml-2">@{comment.user.username}</span>
                    <span className="text-xs text-muted-foreground ml-2">{formatDate(comment.timestamp)}</span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="mt-1">{comment.content}</p>

                <div className="flex items-center gap-4 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={likedComments[comment.id] ? "text-red-500" : "text-muted-foreground"}
                    onClick={() => toggleLikeComment(comment.id)}
                  >
                    <Heart className="h-4 w-4 mr-1" fill={likedComments[comment.id] ? "currentColor" : "none"} />
                    {comment.likes + (likedComments[comment.id] ? 1 : 0)}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  >
                    Reply
                  </Button>
                </div>

                {replyingTo === comment.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder={`Reply to @${comment.user.username}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleAddReply(comment.id)} disabled={!replyContent.trim()}>
                        Reply
                      </Button>
                    </div>
                  </div>
                )}

                {comment.replies.length > 0 && (
                  <div className="mt-4 space-y-4 pl-6 border-l-2 border-muted">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reply.user.avatarUrl || "/placeholder.svg"} alt={reply.user.name} />
                          <AvatarFallback>{reply.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{reply.user.name}</span>
                              <span className="text-muted-foreground ml-2">@{reply.user.username}</span>
                              <span className="text-xs text-muted-foreground ml-2">{formatDate(reply.timestamp)}</span>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreHorizontal className="h-3 w-3" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Flag className="h-4 w-4 mr-2" />
                                  Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <p className="mt-1 text-sm">{reply.content}</p>

                          <Button
                            variant="ghost"
                            size="sm"
                            className={`mt-1 h-6 ${likedReplies[reply.id] ? "text-red-500" : "text-muted-foreground"}`}
                            onClick={() => toggleLikeReply(reply.id)}
                          >
                            <Heart className="h-3 w-3 mr-1" fill={likedReplies[reply.id] ? "currentColor" : "none"} />
                            {reply.likes + (likedReplies[reply.id] ? 1 : 0)}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
