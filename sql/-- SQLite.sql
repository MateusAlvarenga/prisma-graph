-- SQLite

select * from Post p  
 
SELECT * FROM User u
JOIN Post  on Post.authorId = u.id
JOIN Comment c on c.postId  = Post.id 
