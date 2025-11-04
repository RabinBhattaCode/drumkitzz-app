"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, Flag, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data for comments
const MOCK_COMMENTS = [
  {
    id: "1",
    user: {
      id: "user1",
      name: "Alex Johnson",
      avatar: "/vibrant-street-market.png",
    },
    content: "These drums are fire! The kick has so much punch and the snares are crisp.",
    timestamp: "2 hours ago",
    likes: 24,
    replies: [
      {
        id: "reply1",
        user: {
          id: "user2",
          name: "Sarah Miller",
          avatar: "/drum-kit-stage.png",
        },
        content: "I agree! I've been using these in my latest tracks.",
        timestamp: "1 hour ago",
        likes: 8,
      },
    ],
  },
  {
    id: "2",
    user: {
      id: "user3",
      name: "Mike Williams",
      avatar: "/dusty-beats.png",
    },
    content: "The hi-hats in this kit are exactly what I've been looking for. Great work!",
    timestamp: "5 hours ago",
    likes: 15,
    replies: [],
  },
]

type Comment = {
  id: string
  user: {
    id: string
    name: string
    avatar: string
  }
  content: string
  timestamp: string
  likes: number
  replies?: Comment[]
}

export function CommentSection({ kitId }: { kitId: string }) {
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      user: {
        id: "currentUser",
        name: "You",
        avatar: "/vibrant-street-market.png",
      },
      content: newComment,
      timestamp: "Just now",
      likes: 0,
      replies: [],
    }

    setComments([comment, ...comments])
    setNewComment("")
  }

  const handleAddReply = (commentId: string) => {
    if (!replyContent.trim()) return

    const reply: Comment = {
      id: `reply-${Date.now()}`,
      user: {
        id: "currentUser",
        name: "You",
        avatar: "/vibrant-street-market.png",
      },
      content: replyContent,
      timestamp: "Just now",
      likes: 0,
    }

    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply],
        }
      }
      return comment
    })

    setComments(updatedComments)
    setReplyingTo(null)
    setReplyContent("")
  }

  const handleLike = (commentId: string, isReply = false, parentId?: string) => {
    if (!isReply) {
      setComments(
        comments.map((comment) => (comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment)),
      )
    } else if (parentId) {
      setComments(
        comments.map((comment) => {
          if (comment.id === parentId && comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === commentId ? { ...reply, likes: reply.likes + 1 } : reply,
              ),
            }
          }
          return comment
        }),
      )
    }
  }

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-bold">Comments</h3>

      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src="/vibrant-street-market.png" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button onClick={handleAddComment}>Comment</Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-4">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.user.avatar || "/placeholder.svg"} />
                <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{comment.user.name}</h4>
                    <p className="text-sm text-muted-foreground">{comment.timestamp}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Flag className="h-4 w-4 mr-2" /> Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-2">{comment.content}</p>
                <div className="flex gap-4 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => handleLike(comment.id)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" /> {comment.likes}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>

            {replyingTo === comment.id && (
              <div className="flex gap-4 ml-14">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/vibrant-street-market.png" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Add a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleAddReply(comment.id)}>Reply</Button>
                  </div>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-14 space-y-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="flex gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reply.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{reply.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{reply.user.name}</h4>
                          <p className="text-sm text-muted-foreground">{reply.timestamp}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Flag className="h-4 w-4 mr-2" /> Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="mt-2">{reply.content}</p>
                      <div className="flex gap-4 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => handleLike(reply.id, true, comment.id)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" /> {reply.likes}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
