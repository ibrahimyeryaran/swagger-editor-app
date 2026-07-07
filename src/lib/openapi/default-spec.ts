export const DEFAULT_SPEC = `openapi: 3.0.3
info:
  title: JSONPlaceholder API
  version: 1.0.0
  description: A demo schema for the free JSONPlaceholder REST API. Paste your own OpenAPI or Swagger schema here.
servers:
  - url: https://jsonplaceholder.typicode.com
paths:
  /posts:
    get:
      summary: List all posts
      parameters:
        - name: userId
          in: query
          required: false
          description: Filter posts by user id
          schema:
            type: integer
      responses:
        '200':
          description: A list of posts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Post'
    post:
      summary: Create a post
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewPost'
      responses:
        '201':
          description: The created post
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
  /posts/{id}:
    get:
      summary: Get a post by id
      parameters:
        - name: id
          in: path
          required: true
          description: The post id
          schema:
            type: integer
      responses:
        '200':
          description: The requested post
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '404':
          description: Post not found
components:
  schemas:
    Post:
      type: object
      required:
        - id
        - title
      properties:
        id:
          type: integer
          example: 1
        userId:
          type: integer
          example: 1
        title:
          type: string
          example: Hello world
        body:
          type: string
          example: This is the post body.
    NewPost:
      type: object
      required:
        - title
      properties:
        userId:
          type: integer
          example: 1
        title:
          type: string
          example: My new post
        body:
          type: string
          example: Content of the new post.
`;
