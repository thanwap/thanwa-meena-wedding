using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WeddingApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestsAndTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "wedding_tables",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    Shape = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "circle"),
                    PositionX = table.Column<double>(type: "double precision", nullable: false, defaultValue: 0.0),
                    PositionY = table.Column<double>(type: "double precision", nullable: false, defaultValue: 0.0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wedding_tables", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "guests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RsvpId = table.Column<int>(type: "integer", nullable: false),
                    TableId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_guests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_guests_rsvps_RsvpId",
                        column: x => x.RsvpId,
                        principalTable: "rsvps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_guests_wedding_tables_TableId",
                        column: x => x.TableId,
                        principalTable: "wedding_tables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_guests_RsvpId",
                table: "guests",
                column: "RsvpId");

            migrationBuilder.CreateIndex(
                name: "IX_guests_TableId",
                table: "guests",
                column: "TableId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "guests");

            migrationBuilder.DropTable(
                name: "wedding_tables");
        }
    }
}
